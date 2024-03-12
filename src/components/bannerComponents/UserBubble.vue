<script>
export default {
    props: ['user'],
    data() {
        return {
            hover: false,
            longHover: false,
            owner: false,
        }
    },
    mounted() {
        if (this.$umlWebClient.group === this.user.user) {
            this.owner = true;
        }
    },
    computed: {
        userStyle() {
            const ret = {
                'background-color': this.user.color.slice(0, -5) + 'user-light',
                color: this.user.color.slice(0, -5) + 'user'
            };
            if (this.user.id === this.$umlWebClient.id) {
                ret.border = 'solid ' + this.user.color.slice(0, -5) + 'user-highlight';
            } else {
                ret.border = 'solid ' + this.user.color;
            }
            if (this.hover && this.user.user && this.user.user !== '0') {
                ret['min-width'] = this.user.user.length * 12 + 'px'
            }
            return ret; 
        },
        userLabel() {
            if (this.user.user && this.user.user !== '0') {
                if (this.hover) {
                    return this.user.user;
                } else {
                    return Array.from(this.user.user)[0];
                }
            } else {
                return '';
            }
        },
        fullUserName() {
            if (this.user && this.user.user !== '0' && this.user.user) {
                return this.user.user;
            } else {
                return 'anonymous';
            }
        },
        userSemanticColor() {
            switch (this.user.color) {
                case 'var(--uml-cafe-blue-user)':
                    return 'blue';
                case 'var(--uml-cafe-green-user)':
                    return 'green';
                case 'var(--uml-cafe-red-user)':
                    return 'red';
                case 'var(--uml-cafe-yellow-user)':
                    return 'yellow';
                case 'var(--uml-cafe-magenta-user)':
                    return 'magenta';
                case 'var(--uml-cafe-orange-user)':
                    return 'orange';
                case 'var(--uml-cafe-cyan-user)':
                    return 'cyan';
                case 'var(--uml-cafe-lime-user)':
                    return 'lime';
                default:
                    return 'unknown';
            }
        },
    },
    methods: {
        mouseEnter() {
            if (!this.hover) {
                this.hover = true;
                setTimeout(() => {
                    if (this.hover) {
                        this.longHover = true;
                    }
                }, 1000);
            }
        },
        mouseLeave() {
            if (this.hover) {
                this.hover = false;
            }
            setTimeout(() => {
                if (!this.hover) {
                    if (this.longHover) {
                        this.longHover = false;
                    }
                }
            }, 250);
        },
    }
}
</script>
<template>
    <div class="baseUser" 
    :style="userStyle"
    @mouseenter="mouseEnter"
    @mouseleave="mouseLeave"
    ref="bubble">
        {{ userLabel }}
        <div v-if="longHover" class="infoPanel">
            <div>
                user : {{ fullUserName }}
            </div>
            <div>
                color : {{ userSemanticColor }}
            </div>
            <div v-if="owner">
                ★ owner
            </div>
        </div>
    </div>
</template>
<style>
.baseUser {
    height: 30px;
    width: 30px;
    border-radius: 15px;
    display: inline-block;
    margin-top: 10px;
    margin: 5px;
    font-size: 12px;
    font-weight: bold;
    padding-left: 7px;
    padding-top: 2px;
    -webkit-user-select: none; /* Safari */        
    -moz-user-select: none; /* Firefox */
    -ms-user-select: none; /* IE10+/Edge */
    user-select: none; /* Standard */
}
.infoPanel {
    color: var(--vt-c-text-light-1);
    font-size: 15px;
    position: absolute;
    opacity: 0.8;
    padding: 10px;
    height: auto;
    width: 140px;
    background-color: var(--vt-c-dark-soft);
    top: 35px;
    left: -5px;
    z-index: 99;
    overflow: hidden;
    border-radius: 10px;
    -webkit-user-select: text; /* Safari */        
    -moz-user-select: text; /* Firefox */
    -ms-user-select: text; /* IE10+/Edge */
    user-select: text; /* Standard */
    border: solid 1px var(--vt-c-white-soft);
}
</style>