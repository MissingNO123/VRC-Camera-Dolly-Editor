import osc from "osc";

interface WildcardHandler {
    regex: RegExp;
    callback: (message: any) => void | Promise<void>;
}

export class OSCHandler {
    private handlers: { [address: string]: (message: any) => void | Promise<void> } = {};
    private wildcardHandlers: WildcardHandler[] = [];

    bind(address: string, callback: (message: any) => void | Promise<void>) {
        if (address.includes("*")) {
            // Convert wildcard pattern to regular expression.
            // Escape special regex characters except for *
            let escaped = address.replace(/([.+?^${}()|\[\]\\])/g, '\\$1');
            // Replace '*' with '.*' for matching any characters
            let regexStr = "^" + escaped.replace(/\*/g, ".*") + "$";
            const regex = new RegExp(regexStr);
            this.wildcardHandlers.push({ regex, callback });
        } else {
            this.handlers[address] = callback;
        }
    }

    async handle(message: any) {
        // Check for exact match first
        if (this.handlers[message.address]) {
            await this.handlers[message.address](message);
            return;
        }

        // Then check for any wildcard matches
        for (const handler of this.wildcardHandlers) {
            if (handler.regex.test(message.address)) {
                await handler.callback(message);
            }
        }
    }
}

export const getOscSender = () => {
    const oscSendPort = 9000;
    const oscSender = new osc.UDPPort({
        localAddress: "127.0.0.1",
        localPort: parseInt(process.env.OSC_PORT || "9999")|| 9999,
        remoteAddress: "127.0.0.1",
        remotePort: oscSendPort,
    });
    oscSender.open();
    return oscSender;
}

export const sendMessage = (oscSender: osc.UDPPort, address: string, args: any[]) => {
    const message = {
        address,
        args,
    };
    oscSender.send(message);
};

export const chatbox = async (oscSender: osc.UDPPort, message: string) => {
    sendMessage(oscSender, "/chatbox/input", [
        {type:"s", value: message},
        {type:"i", value: 0},
        {type:"i", value: 0},
    ]);
}

export const dollyPlay = async (oscSender: osc.UDPPort) => {
    sendMessage(oscSender, "/dolly/Play", [{type:"i", value: 1}]);
}

export const dollyPlayDelayed = async (oscSender: osc.UDPPort, delay: number) => {
    sendMessage(oscSender, "/dolly/PlayDelayed", [{type:"i", value: 1}, {type:"f", value: delay}]);
}

export const exportPaths = async (oscSender: osc.UDPPort) => {
    sendMessage(oscSender, "/dolly/Export", [{type:"i", value: 1}]);
}

export const importPaths = async (oscSender: osc.UDPPort, jsonString: string) => {
    sendMessage(oscSender, "/dolly/Import", [{type:"s", value: jsonString}]);
}



