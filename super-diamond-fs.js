// Initialize storage
var SuperDiamondFSStore = null;
var SuperDiamondFSConfigStore = null;
async function SuperDiamondFSInitalizeStorage() {
    SuperDiamondFSStore = new SuperDiamondStoreConst();
    SuperDiamondFSStore.dbName = "SuperDiamondFSFilesystems";
    SuperDiamondFSStore.storeName = "Filesystems";
    await SuperDiamondFSStore.async.reload();
    SuperDiamondFSConfigStore = new SuperDiamondStoreConst();
    SuperDiamondFSConfigStore.dbName = "SuperDiamondFSConfig";
    SuperDiamondFSConfigStore.storeName = "Config";
    await SuperDiamondFSConfigStore.async.reload();
}
function SuperDiamondFSDataGenEmbed(dataURL) {
    let fileType = 'unknown';
    let element;

    // Check if the data URL starts with specific prefixes to determine the file type
    if (dataURL.startsWith('data:image/')) {
        fileType = 'image';
    } else if (dataURL.startsWith('data:audio/')) {
        fileType = 'audio';
    } else if (dataURL.startsWith('data:video/')) {
        fileType = 'video';
    } else if (dataURL.startsWith('data:text/html')) {
        fileType = 'iframe';
    } else if (dataURL.startsWith('data:text/css')) {
        fileType = 'css';
    } else if (dataURL.startsWith('data:application/javascript')) {
        fileType = 'js';
    } else if (dataURL.startsWith('data:')) {
        fileType = 'embed';
    }

    // Create the appropriate HTML element based on the file type
    switch (fileType) {
        case 'image':
            element = document.createElement('img');
            element.src = dataURL;
            break;
        case 'audio':
            element = document.createElement('audio');
            element.src = dataURL;
            element.controls = true;
            break;
        case 'video':
            element = document.createElement('video');
            element.src = dataURL;
            element.controls = true;
            break;
        case 'iframe':
            element = document.createElement('iframe');
            element.src = dataURL;
            break;
        case 'css':
            element = document.createElement('link');
            element.rel = 'stylesheet';
            element.href = dataURL;
            break;
        case 'js':
            element = document.createElement('script');
            element.src = dataURL;
            break;
        case 'embed':
            element = document.createElement('embed');
            element.src = dataURL;
            break;
        default:
            // If the file type is not recognized, return null
            element = null;
            break;
    }

    return element;
}




function isJsonString(str) {
  try {
    JSON.parse(str);
    return true;
  } catch (e) {
    return false;
  }
}

// Function to convert a data URL to a Blob
function dataURLToBlob(dataURL) {
  const [header, base64Data] = dataURL.split(',');
  const mime = header.match(/:(.*?);/)[1];
  const binaryString = atob(base64Data);
  const length = binaryString.length;
  const arrayBuffer = new Uint8Array(length);
  
  for (let i = 0; i < length; i++) {
    arrayBuffer[i] = binaryString.charCodeAt(i);
  }

  return new Blob([arrayBuffer], { type: mime });
}

async function ParseSuperDiamondFSFileWrite(data) {
    if (typeof data === "string") {
        return {
            type: "text",
            data: data
        };
    } else if (data instanceof File) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const blob = reader.result;
                resolve({
                    type: "file",
                    mimeType: data.type,
                    data: new Blob([blob], { type: data.type })
                });
            };
            reader.onerror = reject;
            reader.readAsBinaryString(data);
        });
    } else if (data instanceof Blob) {
        return {
            type: "blob",
            data: data
        };
    } else {
        throw new Error("Unsupported data type");
    }
}

async function blobToDataURL(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const dataURL = reader.result;
            resolve(dataURL);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}


function calculateObjectSize(obj) {
    let totalSize = 0;

    const stack = [obj];
    const visited = new Set();

    while (stack.length) {
        const current = stack.pop();

        if (typeof current === 'object' && current !== null) {
            if (visited.has(current)) continue;
            visited.add(current);

            for (const key in current) {
                if (current.hasOwnProperty(key)) {
                    const value = current[key];
                    const keySize = key.length * 2; // Size of the key name
                    if (typeof value === 'string') {
                        const blob = new Blob([value]);
                        totalSize += blob.size;
                    } else if (typeof value === 'object' && value !== null) {
                        stack.push(value);
                    } else {
                        // For non-string primitive types
                        totalSize += String(value).length * 2; // Assuming UTF-16 encoding
                    }
                    totalSize += keySize;
                }
            }
        }
    }

    return totalSize;
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
    system: {
     FSHandlersActive: 0
    },
    FSHandlersActive: function() {
     return SuperDiamondFS.system.FSHandlersActive;
    },
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


function SuperDiamondFSFilesystemClosed() {
 this.closed = true
}
function SuperDiamondFSFilesystem(name, data, memfs) {
    var MaxFSHandlers;
    (async function() {
        try {
            MaxFSHandlers = await SuperDiamondFSConfigStore.async.getItem("MaxFSHandlers");
        } catch(err) {
            
        }
    })();
    if(SuperDiamondFS.system.FSHandlersActive + 1 > MaxFSHandlers) {
     var error = new Error("Failed To Create Filesystem. The Maximum Amount of Filesystem handlers have been reached. (ERR_MAX_FS_HANDLERS)");
     error.code = "ERR_MAX_FS_HANDLERS";
     throw error;
     return error;
    }
    SuperDiamondFS.system.FSHandlersActive = SuperDiamondFS.system.FSHandlersActive + 1;
    this.closed = false
    this.data = data;
    this.memfs = memfs;
    this.close = function() {
     SuperDiamondFS.system.FSHandlersActive = SuperDiamondFS.system.FSHandlersActive - 1;
     this.closed = true
     for (let key in this) {
        if (typeof this[key] === 'function') {
            this[key] = undefined;
        }
     }
    }
    this.setData = async function(newdata) {
     var StorageFSMaxSize = await SuperDiamondFSConfigStore.async.getItem("StorageFSMaxSize");
     var MemFSMaxSize = await SuperDiamondFSConfigStore.async.getItem("MemFSMaxSize");
     var MaxSize = StorageFSMaxSize;
     if(this.memfs) {
      MaxSize = MemFSMaxSize;
     }
     if(calculateObjectSize(newdata) < MaxSize) {
      this.data = newdata;
      this.saveIfNotMemfs()
     } else {
      var error = new Error("Failed to set content of filesystem. the filesystem is out of space. (ERR_FS_MAX_SIZE_REACHED)");
      error.code = "ERR_FS_MAX_SIZE_REACHED";
      throw error;
      return error;
     }
    }
this.createDirectory = async function(path) {
    let newData = { ...this.data }; // Create a new object based on the existing data
    let currentDir = newData;
    const directories = path.split('/');
    for (let i = 0; i < directories.length; i++) {
        const directory = directories[i];
        const encodedDirectoryName = SuperDiamondFSEncode(directory);
        if (!currentDir[encodedDirectoryName]) {
            currentDir[encodedDirectoryName] = {};
        }
        currentDir = currentDir[encodedDirectoryName];
    }
    await this.setData(newData); // Update the data using setData
};
this.embedFile = function(filePath) {
 try {
  var fileBlob = this.readFile(filePath)
 } catch(err) {
  throw new Error("Error Reading File to embed: " + err, { cause: err})
 }
 if(fileBlob instanceof Blob) {
  var dataURL = blobToDataURL(fileBlob);
  var elem = SuperDiamondFSDataGenEmbed(dataURL);
  return elem;
 } else {
  throw new Error("File to embed is not a blob.");
 }
}
this.writeFile = async function(filePath, content) {
    let newData = { ...this.data }; // Create a new object based on the existing data
    let currentDir = newData;
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
    var processedContent = await ParseSuperDiamondFSFileWrite(content);
    var writeContent = "";
    if(processedContent.type = "text") {
     writeContent = processedContent.data;
    }
    if(processedContent.type = "blob") {
     writeContent = JSON.stringify({
      specialType: "awruanvtuinetvhiothoevnmewihntvoemrtevorhntveoirhtnv",
      data: await blobToDataURL(processedContent.data)
     })
    }
    currentDir[encodedFileName] = SuperDiamondFSEncode(writeContent);
    await this.setData(newData); // Update the data using setData
};

this.deleteFile = async function(filePath) {
    let newData = { ...this.data }; // Create a new object based on the existing data
    let currentDir = newData;
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
    await this.setData(newData); // Update the data using setData
};
    this.getSizeInBytes = function() {
     var size = calculateObjectSize(this.data);
     return size;
    }
    this.getMaxSpaceInBytes = async function() {
      var StorageFSMaxSize = await SuperDiamondFSConfigStore.async.getItem("StorageFSMaxSize");
      var MemFSMaxSize = await SuperDiamondFSConfigStore.async.getItem("StorageFSMaxSize");
     var MaxSize = StorageFSMaxSize;
     if(this.memfs) {
      MaxSize = MemFSMaxSize;
     }
     return MaxSize;
    }
    this.getRemainingSpaceInBytes = async function() {
     var size = calculateObjectSize(this.data);
      var StorageFSMaxSize = await SuperDiamondFSConfigStore.async.getItem("StorageFSMaxSize");
      var MemFSMaxSize = await SuperDiamondFSConfigStore.async.getItem("StorageFSMaxSize");
     var MaxSize = StorageFSMaxSize;
     if(this.memfs) {
      MaxSize = MemFSMaxSize;
     }
     return MaxSize - size;
    }
    this.saveIfNotMemfs = async function() {
    var StorageFSMaxSize = await SuperDiamondFSConfigStore.async.getItem("StorageFSMaxSize");
     if(calculateObjectSize(this.data) > StorageFSMaxSize) {
      var error = new Error("Failed to save filesystem. the filesystem is out of space. (ERR_FS_MAX_SIZE_REACHED)");
      error.code = "ERR_FS_MAX_SIZE_REACHED";
      throw error;
      return error;
     }
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
if (isJsonString(SuperDiamondFSDecode(currentDir[encodedFileName]))) {
  const decodedString = SuperDiamondFSDecode(currentDir[encodedFileName]);
  try {
    const parsedData = JSON.parse(decodedString);
    if (parsedData && parsedData.specialType === "awruanvtuinetvhiothoevnmewihntvoemrtevorhntveoirhtnv" && parsedData.data) {
      var JSONContent = parsedData;
      return dataURLToBlob(JSONContent.data);
    } else {
      return decodedString;
    }
  } catch (error) {
    console.error("Error parsing JSON:", error);
    return decodedString;
  }
} else {
  return SuperDiamondFSDecode(currentDir[encodedFileName]);
}


    };
}
(async () => {
 await SuperDiamondFSInitalizeStorage();
 try {
  await SuperDiamondFSConfigStore.async.getItem("ConfigSet");
 } catch(err) {
  await SuperDiamondFSConfigStore.async.setItem("MemFSMaxSize", 10737418240);
  await SuperDiamondFSConfigStore.async.setItem("StorageFSMaxSize", 10737418240);
  await SuperDiamondFSConfigStore.async.setItem("MaxFSHandlers", 100);
  await SuperDiamondFSConfigStore.async.setItem("ConfigSet", true);
 }
})();
