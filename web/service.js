import OSS from "ali-oss"
import * as localForage from "localforage"
import axios from 'axios'
import JSZip from 'jszip'
import FileSaver from 'file-saver'

let service = {
    path:[],
    client: {},
    tempInfo: [],
    fileInfo: [],
    currentFile: "",
    current: 0,
    zipFile: {},
    totalCount: 0,
    totalSize: 0,
    init(ready) {
        this.loadClient(ready)
        setInterval(()=>{
            this.loadClient(null)
        }, 30*60*1000)
        localForage.getItem("pastpaper_list",(err, readValue) => {
            if(err) {
                console.error(err)
            } else {
                if(Array.isArray(readValue)) {
                    this.fileInfo = readValue
                    ready(true)
                }
            }
        })
    },
    loadClient(ready) {
        axios.get("/token").then((response) => {
            if(response.data["code"] === 200) {
                let data = response.data["data"]
                this.client = new OSS({
                    region: 'oss-cn-shanghai',
                    accessKeyId: data["AccessKeyId"],
                    accessKeySecret: data["AccessKeySecret"],
                    stsToken: data["SecurityToken"],
                    bucket: 'nfls-papers',
                    secure: true,
                    timeout: "60s"
                });
                if(ready != null)
                    this.loadFiles("", ready)
            }
        })
    },
    loadFiles(next, ready) {
        this.client.list({
            "max-keys": 1000,
            "marker": next
        }).then((result) => {
            this.tempInfo = this.tempInfo.concat(result.objects)
            if (result.objects.length === 1000) {
                this.currentFile = result.nextMarker
                this.loadFiles(result.nextMarker, ready)
            } else {
                this.fileInfo = this.tempInfo
                this.tempInfo = []
                ready(true)
                localForage.setItem("pastpaper_list", this.fileInfo)
            }
        })
    }, getCurrentPath() {
        let reducer = (accumulator, currentValue) => accumulator + "/" + currentValue;
        let uri = this.path.reduce(reducer, "") + "/"
        if (uri.startsWith("/"))
            uri = uri.slice(1)
        return uri
    }, enter(item, callback) {
        if (item.size === -1) {
            this.back()
            this.updateItems(callback)
        }else if (item.size === 0) {
            this.path.push(item.displayName)
            this.updateItems(callback)
        } else {
            let url = this.client.signatureUrl(item.name, {
                "expires": 60,
                "response": {
                    "content-disposition": "attachment;filename=\"" + item.displayName + "\""
                }
            })
            this.downloadURI(url, item.displayName)
        }
    }, jump(paths, callback) {
        this.path = paths
        this.updateItems(callback)
    }, updateItems(callback) {
        this.displayItems = this.fileInfo.filter((object) => {
            if (object.name.endsWith("/")) {
                return object.name.split("/").length - 1 === this.path.length + 1 && object.name.startsWith(this.getCurrentPath())
            } else {
                return object.name.split("/").length === this.path.length + 1 && object.name.startsWith(this.getCurrentPath())
            }
        })
        this.displayItems = this.displayItems.map((object) => {
            object.displayName = object.name.replace(this.getCurrentPath(), "").replace("/", "")
            object.displaySize = this.getSize(object.size)
            return object
        })
        if(this.getCurrentPath().includes("Past Papers")) {
            this.displayItems = this.displayItems.reverse()
        }
        if(this.path.length > 0) {
            this.displayItems.unshift({
                displayName: "返回",
                size: -1
            })
        }

        callback(this.displayItems, this.getCurrentPath())
    }, batch(items, callback) {
        this.toDownload = []
        items.forEach((value) => {
            if (value.size < 0)
                return
            if (value.size === 0)
                this.toDownload = this.toDownload.concat(this.fileInfo.filter(item => item.name.startsWith(value.name)))
            else
                this.toDownload = this.toDownload.concat(value)
        })
        this.totalCount = this.toDownload.length
        if(this.totalCount > 200) {
            callback("总文件数量超过200个限制，请分批下载，以免浏览器死机！（目前共" + this.totalCount + "个）", 0, 0, 0, 0, false)
            return
        }
        this.totalSize = this.getTotalSize()
        if(this.totalSize > 1024 * 1024 * 512) {
            callback("总文件大小超过512MB限制，请分批下载，以免浏览器死机！（目前共" + this.getSize(this.totalSize) + "）", 0, 0, 0, 0, false)
            return
        }
        if(this.toDownload.length > 0) {
            this.zipFile = new JSZip();
            this.downloadBatch(callback)
        } else {
            callback("没有选中任何文件！", 0, 0, 0, 0, false)
            return
        }
    }, downloadBatch(callback) {
        callback(null, this.totalCount, this.toDownload.length, this.totalSize, this.getTotalSize(), false)
        if (this.toDownload.length === 0) {
            let FileSaver = require('file-saver')
            this.zipFile.generateAsync({type: "blob"}).then((blob) => {
                callback(null, this.totalCount, this.toDownload.length, this.totalSize, this.getTotalSize(), true)
                FileSaver.saveAs(blob, (this.path[this.path.length - 1] || "Resources") + "@" + (Math.floor(Math.random() * 10000000000)) + ".zip");
            })
        } else {
            let item = this.toDownload.pop()
            if (item.size === 0) {
                this.downloadBatch(callback)
                return
            }
            axios.get(this.client.signatureUrl(item.name), {
                responseType: 'blob',
                onDownloadProgress: (progressEvent) => {
                    callback(null, this.totalCount, this.toDownload.length, this.totalSize, this.getTotalSize() + (progressEvent.total - progressEvent.loaded), false)
                }
            }).then((response) => {
                this.zipFile.file(item.name.replace(this.getCurrentPath(), ""), response.data)
                this.downloadBatch(callback)
            })
        }
    }, back() {
        this.path.pop()
    }, downloadURI(uri, name) {
        let link = document.createElement("a");
        link.download = name;
        link.href = uri;
        link.target = "_blank";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }, getTotalSize() {
        return this.toDownload.reduce((accumulator, currentValue) => {
            return accumulator + currentValue.size
        }, 0)
    }, cancel() {
        this.toDownload = []
    }, clean() {
        this.$removeItem("pastpaper_list")
        window.location.reload()
    }, getSize(size) {
        if(size === 0)
            return "文件夹"
        size = size / 1024
        let count = 0
        while(size > 1024) {
            size = size / 1024
            count ++
        }
        let quantity = ""
        switch(count){
            case 0:
                quantity = "KB"
                break
            case 1:
                quantity = "MB"
                break
            case 2:
                quantity = "GB"
                break
            default:
                quantity = "--"
                break
        }
        return size.toFixed(1) + quantity
    }
}

export default service