// Initialize storage
var SuperDiamondFSStore = null;

async function SuperDiamondFSInitalizeStorage() {
    SuperDiamondFSStore = new SuperDiamondStoreConst();
    SuperDiamondFSStore.dbName = "SuperDiamondFS";
    SuperDiamondFSStore.storeName = "Filesystems";
    await SuperDiamondFSStore.async.reload();
}

// Encoding and decoding functions
function SuperDiamondFSDecode(EncodedData) {
    // Decode Base64
    const decodedBytes = Uint8Array.from(atob(EncodedData), c => c.charCodeAt(0));

    // Create a TextDecoder instance
    const decoder = new TextDecoder();

    // Decode the bytes to a string
    const decodedString = decoder.decode(decodedBytes);

    return decodedString;
}

function SuperDiamondFSEncode(Data) {
    // Convert string to bytes
    const encoder = new TextEncoder();
    const bytes = encoder.encode(Data);
    
    // Convert bytes to Base64
    const base64String = btoa(String.fromCharCode.apply(null, bytes));

    return base64String;
}

// File system object
var SuperDiamondFS = {
    // Function to load filesystem from storage
    loadFSFromStorage: async function(name) {
        if (!SuperDiamondFSStore) {
            await SuperDiamondFSInitalizeStorage();
        }
        return new SuperDiamondFSFilesystem(name, await SuperDiamondFSStore.async.getItem(name), false);
    },
    
    // Function to create a memory-based filesystem
    creatememFS: function() {
        return new SuperDiamondFSFilesystem("MEMFS", {}, true);
    },
    
    // Function to create a filesystem for storage
    createstorageFS: function(name) {
      return new SuperDiamondFSFilesystem(name, {}, false);
    }
};



// File system object constructor
function SuperDiamondFSFilesystem(name, data, memfs) {
    this.data = data;
    this.memfs = memfs;

    this.createDirectory = function(path) {
        let currentDir = this.data;
        const directories = path.split('/');
        for (let i = 0; i < directories.length; i++) {
            const directory = directories[i];
            const encodedDirectoryName = SuperDiamondFSEncode(directory);
            if (!currentDir[encodedDirectoryName]) {
                currentDir[encodedDirectoryName] = {};
            }
            currentDir = currentDir[encodedDirectoryName];
        }
        this.saveIfNotMemfs();
    };

    this.writeFile = async function(filePath, content) {
        let currentDir = this.data;
        const directories = filePath.split('/');
        for (let i = 0; i < directories.length - 1; i++) {
            const directory = directories[i];
            const encodedDirectoryName = SuperDiamondFSEncode(directory);
            if (!currentDir[encodedDirectoryName]) {
                throw new Error("Directory does not exist.");
            }
            currentDir = currentDir[encodedDirectoryName];
        }
        const fileName = directories[directories.length - 1];
        const encodedFileName = SuperDiamondFSEncode(fileName);
        currentDir[encodedFileName] = SuperDiamondFSEncode(content);
        await this.saveIfNotMemfs();
    };

    this.deleteFile = async function(filePath) {
        let currentDir = this.data;
        const directories = filePath.split('/');
        for (let i = 0; i < directories.length - 1; i++) {
            const directory = directories[i];
            const encodedDirectoryName = SuperDiamondFSEncode(directory);
            if (!currentDir[encodedDirectoryName]) {
                throw new Error("Directory does not exist.");
            }
            currentDir = currentDir[encodedDirectoryName];
        }
        const fileName = directories[directories.length - 1];
        const encodedFileName = SuperDiamondFSEncode(fileName);
        delete currentDir[encodedFileName];
        await this.saveIfNotMemfs();
    };

    this.saveIfNotMemfs = async function() {
        if (!this.memfs && SuperDiamondFSStore) {
            await SuperDiamondFSStore.async.setItem(name, this.data);
        }
    };
    this.readFile = function(filePath) {
        let currentDir = this.data;
        const directories = filePath.split('/');
        for (let i = 0; i < directories.length - 1; i++) {
            const directory = directories[i];
            const encodedDirectoryName = SuperDiamondFSEncode(directory);
            if (!currentDir[encodedDirectoryName]) {
                throw new Error("Directory does not exist.");
            }
            currentDir = currentDir[encodedDirectoryName];
        }
        const fileName = directories[directories.length - 1];
        const encodedFileName = SuperDiamondFSEncode(fileName);
        if (!currentDir[encodedFileName]) {
            throw new Error("File does not exist.");
        }
        return SuperDiamondFSDecode(currentDir[encodedFileName]);
    };
}
