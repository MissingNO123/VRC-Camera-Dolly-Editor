import { ipcRenderer, contextBridge } from 'electron';
import { openFileResult, saveFileResult } from '../types';

/**
 * Using the ipcRenderer directly in the browser through the contextBridge ist not really secure.
 * I advise using the Main/api way !!
 */
contextBridge.exposeInMainWorld('ipcRenderer', ipcRenderer);

// eslint-disable-next-line no-undef
function domReady(condition: DocumentReadyState[] = ['complete', 'interactive']) {
  return new Promise((resolve) => {
    if (condition.includes(document.readyState)) {
      resolve(true);
    } else {
      document.addEventListener('readystatechange', () => {
        if (condition.includes(document.readyState)) {
          resolve(true);
        }
      });
    }
  });
}

const safeDOM = {
  append(parent: HTMLElement, child: HTMLElement) {
    if (!Array.from(parent.children).find((e) => e === child)) {
      return parent.appendChild(child);
    }

    return null;
  },
  remove(parent: HTMLElement, child: HTMLElement) {
    if (parent && Array.from(parent.children).find((e) => e === child)) {
      return parent.removeChild(child);
    }

    return null;
  }
};

/**
 * https://tobiasahlin.com/spinkit
 * https://connoratherton.com/loaders
 * https://projects.lukehaas.me/css-loaders
 * https://matejkustec.github.io/SpinThatShit
 */
function useLoading() {
  const styleContent = `
  .sk-chase {
  
  }

  .sk-chase-dot {
      width: 40px;
      height: 40px;
      position: absolute;
      margin: auto;
      animation: sk-chase-dot 2.0s infinite ease-in-out both;
  }

  .sk-chase-dot:before {
    content: '';
    display: block;
    width: 25%;
    height: 25%;
    background-color: #fff;
    border-radius: 100%;
    animation: sk-chase-dot-before 2.0s infinite ease-in-out both; 
  }

  .sk-chase-dot:nth-child(1) { animation-delay: -1.1s; }
  .sk-chase-dot:nth-child(2) { animation-delay: -1.0s; }
  .sk-chase-dot:nth-child(3) { animation-delay: -0.9s; }
  .sk-chase-dot:nth-child(4) { animation-delay: -0.8s; }
  .sk-chase-dot:nth-child(5) { animation-delay: -0.7s; }
  .sk-chase-dot:nth-child(6) { animation-delay: -0.6s; }
  .sk-chase-dot:nth-child(1):before { animation-delay: -1.1s; }
  .sk-chase-dot:nth-child(2):before { animation-delay: -1.0s; }
  .sk-chase-dot:nth-child(3):before { animation-delay: -0.9s; }
  .sk-chase-dot:nth-child(4):before { animation-delay: -0.8s; }
  .sk-chase-dot:nth-child(5):before { animation-delay: -0.7s; }
  .sk-chase-dot:nth-child(6):before { animation-delay: -0.6s; }
  
  @keyframes sk-chase {
    100% { transform: rotate(360deg); } 
  }
  
  @keyframes sk-chase-dot {
    80%, 100% { transform: rotate(360deg); } 
  }

  @keyframes sk-chase-dot-before {
    50% {
      transform: scale(0.4); 
    } 100%, 0% {
      transform: scale(1.0); 
    } 
  }

  .app-loading-wrap {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #282c34;
    z-index: 9;
  }

  .hourglass {
    width: 100px;
    height: 100px;
    stroke: #fff;
    fill: #fff;
    filter: drop-shadow(0 0 5px #00000088);
    animation: hourglass 4s infinite
  }

  @keyframes hourglass {
    0% {
      transform: rotate(0deg)
    }
    50% {
      transform: rotate(180deg)
    }
    100% {
      transform: rotate(360deg)
    }
  }
  `;

  const htmlContent = `
    <div clas="sk-chase">
      <svg class="hourglass" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512">
        <!--!Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.-->
        <path d="M0 32C0 14.3 14.3 0 32 0L64 0 320 0l32 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l0 11c0 42.4-16.9 83.1-46.9 113.1L237.3 256l67.9 67.9c30 30 46.9 70.7 46.9 113.1l0 11c17.7 0 32 14.3 32 32s-14.3 32-32 32l-32 0L64 512l-32 0c-17.7 0-32-14.3-32-32s14.3-32 32-32l0-11c0-42.4 16.9-83.1 46.9-113.1L146.7 256 78.9 188.1C48.9 158.1 32 117.4 32 75l0-11C14.3 64 0 49.7 0 32zM96 64l0 11c0 25.5 10.1 49.9 28.1 67.9L192 210.7l67.9-67.9c18-18 28.1-42.4 28.1-67.9l0-11L96 64zm0 384l192 0 0-11c0-25.5-10.1-49.9-28.1-67.9L192 301.3l-67.9 67.9c-18 18-28.1 42.4-28.1 67.9l0 11z"/>
      </svg>
    </div>
  `;

  const oStyle = document.createElement('style');
  const oDiv = document.createElement('div');

  oStyle.id = 'app-loading-style';
  oStyle.innerHTML = styleContent;
  oDiv.id = 'loading-to-remove';
  oDiv.className = 'app-loading-wrap';
  oDiv.innerHTML = htmlContent;

  return {
    appendLoading() {
      safeDOM.append(document.head, oStyle);
      safeDOM.append(document.body, oDiv);
    },
    removeLoading() {
      safeDOM.remove(document.head, oStyle);
      safeDOM.remove(document.body, oDiv);
    }
  };
}

const { appendLoading, removeLoading } = useLoading();

domReady().then(appendLoading);

declare global {
  interface Window {
    Main: typeof api;
    ipcRenderer: typeof ipcRenderer;
  }
}

const api = {
  /**
   * Here you can expose functions to the renderer process
   * so they can interact with the main (electron) side
   * without security problems.
   *
   * The function below can accessed using `window.Main.sayHello`
   */
  sendMessage: (message: string) => {
    ipcRenderer.send('message', message);
  },
  /**
    Here function for AppBar
   */
  Minimize: () => {
    ipcRenderer.send('minimize');
  },
  Maximize: () => {
    ipcRenderer.send('maximize');
  },
  Close: () => {
    ipcRenderer.send('close');
  },
  removeLoading: () => {
    removeLoading();
  },

  saveFile: async (data: unknown, currentFilePath: string): Promise<saveFileResult> =>
    await ipcRenderer.invoke('dialog:saveFile', data, currentFilePath),

  openFile: async (): Promise<openFileResult> => 
    await ipcRenderer.invoke('dialog:openFile'),

  // OSC stuff
  getOscSender: async () => {
    return await ipcRenderer.invoke('osc:getSender');
  },
  dollyPlayOSC: () => {
    return ipcRenderer.invoke('osc:dollyPlay');
  },
  dollyPlayDelayedOSC: (delay: number) => {
    return ipcRenderer.invoke('osc:dollyPlayDelayed', delay);
  },
  exportPathsOSC: () => {
    return ipcRenderer.invoke('osc:exportPaths');
  },
  importPathsOSC: (jsonString: string) => {
    return ipcRenderer.invoke('osc:importPaths', jsonString);
  },
  chatboxOSC: (message: string) => {
    return ipcRenderer.invoke('osc:chatbox', message);
  },

  // 3D view stuff
  openViewportWindow: async () => await ipcRenderer.invoke('3d:open-viewport-window'),
  doesViewportWindowExist: async () => await ipcRenderer.invoke('3d:does-viewport-window-exist'),
  sendPaths: (paths: any) => ipcRenderer.invoke('3d:send-paths', paths),
  refresh3dViewport: () => ipcRenderer.invoke('3d:refresh-viewport'),

  /**
   * Provide an easier way to listen to events
   */
  on: (channel: string, callback: (data: any) => void) => {
    ipcRenderer.on(channel, (_, data) => callback(data));
  }
};

contextBridge.exposeInMainWorld('Main', api);
