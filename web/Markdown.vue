<template>
    <div v-html="html" v-if="load">

    </div>
</template>

<script>

    export default {
        name: "Markdown",
        props: ['markdown'],
        data: () => ({
            html: "",
            load: false,
            md: require('markdown-it')()
        }),
        mounted() {
            this.html = this.md.render(this.markdown || "")
            this.load = true
        },
        watch: {
            markdown(val) {
                this.load = false
                this.html = this.md.render(val)
                this.load = true
            }
        }
    }
</script>

<style scoped>

</style>