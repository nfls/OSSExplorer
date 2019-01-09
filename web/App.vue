<template>
    <el-container>
    <el-main>
        <el-card class="margin-10" header="资源浏览器">
            <markdown style="margin-top: -18px;" :markdown="announcement + '\n\n-----------'"></markdown>
            <div>
                <el-button type="info" v-for="shortcut in shortcuts" :key="shortcut.name" @click="jump(shortcut.path)" style="display: inline-block; margin: 5px;">{{ shortcut.name }}</el-button>
            </div>
        </el-card>
        <el-card shadow="never" class="margin-10" header="批量下载" v-if="working && this.multipleSelection.length > 0">
            <div >
                <div class="margin-10">
                    <span class="margin-10">大小：</span><el-tag>{{totalSize}}</el-tag>
                </div>
                <div class="margin-10">
                    <span>速度：<el-tag>{{speed}}</el-tag></span>
                </div>
                <div class="margin-10">
                    <span>剩余文件量 / 总文件量 ：</span><el-tag>{{ toDownload }} / {{ totalDownload}}</el-tag>
                </div>
                <div class="margin-10">
                    <el-progress :percentage="sizePercentage" class="margin-10"></el-progress>
                </div>
            </div>
        </el-card>
        <el-card shadow="never" class="margin-10">
            <div slot="header">
                <span>路径： /{{ path }}</span>
                <el-button style="float: right; padding: 3px" type="text" @click="bulk">批量下载</el-button>
            </div>
            <el-table
                    :data="items"
                    style="width: 100%"
                    @row-click="click"
                    @selection-change="handleSelectionChange"
                    v-loading="working"
                    :element-loading-text="loadingText"
                    element-loading-spinner="el-icon-loading"
                    element-loading-background="rgba(0, 0, 0, 0.8)"
                    stripe
            >
                <el-table-column
                        type="selection"
                        width="55">
                </el-table-column>
                <el-table-column
                        sortable
                        prop="displayName"
                        label="名称">
                </el-table-column>
                <el-table-column
                        prop="displaySize"
                        label="大小"
                        width="100">
                </el-table-column>
            </el-table>
        </el-card>
    </el-main>
    </el-container>
</template>

<script>
    import service from "./service"

    export default {
        name: "Explorer",
        data: () => ({
            shortcuts: [],
            announcement: "",
            path: "",
            items: [],
            service: service,
            multipleSelection: [],
            filePercentage: 0,
            sizePercentage: 0,
            toDownload: 0,
            totalDownload: 0,
            totalSize: "0K",
            lastSize: 0,
            speed: "0K/s",
            lastTime: new Date().getTime(),
            working: true,
            loadingText: "文件列表加载中，请稍等30秒左右"
        }),
        methods: {
            reload(objects) {
                this.items = objects
            },
            click(item) {
                this.service.enter(item, (objects, path) => {
                    this.reload(objects)
                    this.path = path
                })
            },
            jump(paths) {
                this.service.jump(paths, (objects, path) => {
                    this.reload(objects)
                    this.path = path
                })
            },
            handleSelectionChange(val) {
                this.multipleSelection = val;
            },
            bulk() {
                this.lastTime = new Date().getTime()
                this.working = true
                this.loadingText = "批量下载进行中"
                service.batch(this.multipleSelection, (message, f_total, f_left, s_total, s_left, finished) => {
                    if(message != null) {
                        this.$notify.error({
                            title: '错误',
                            message: message
                        });
                        this.working = false
                        return
                    }
                    this.toDownload = f_left
                    this.totalDownload = f_total
                    this.sizePercentage = Math.round((s_total - s_left) / s_total * 100)
                    this.totalSize = service.getSize(s_total)
                    let time = new Date()
                    let size = (this.lastSize - s_left) * 1000 / Math.abs(time.getTime() - this.lastTime)
                    if(this.lastSize - s_left !== 0 && this.lastSize !== 0)
                        this.speed = service.getSize(size) + "/s"
                    this.lastTime = time.getTime()
                    this.lastSize = s_left
                    if(finished) {
                        this.working = false
                        this.lastSize = 0
                    }
                })
            }
        },
        mounted() {
            this.axios.get("/shortcuts").then((response)=>{
                this.shortcuts = response.data["data"]
            })
            this.axios.get("/header").then((response)=>{
                this.announcement = response.data["data"]
            })
            this.service.init((ready) => {
                this.working = false
                this.service.updateItems((objects, path) => {
                    this.reload(objects)
                    this.path = path
                })
            })
        }
    }
</script>

<style scoped>
    .margin-10 {
        margin-top:10px;
    }
</style>