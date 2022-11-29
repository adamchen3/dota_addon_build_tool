import * as fs from "fs";

function readAsByteArray(file, callback) {
  fs.readFile(file, null, (err, data)=>{
    let uint8Array = new Uint8Array(data.buffer);
    let array = [].slice.call(uint8Array);
    callback && callback(array, file);
  });
}

export {
  readAsByteArray
};
