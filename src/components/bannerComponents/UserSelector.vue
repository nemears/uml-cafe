<script>
export default {
    props: ['label', 'users', 'theme'],
    methods: {
        addUser() {
            let userValue = this.$refs.userSelectorInput.value;
            if (userValue === undefined || userValue === '') {
                // maybe show error to user
                return;
            }

            userValue = userValue.replace(/['"]+/g, '');

            // check if user exists
            // TODO

            this.$refs.userSelectorInput.value = '';
            this.users.push(userValue);
        },
        rightClick(e) {
            //prevent the browser's default menu
            e.preventDefault();
            //show our menu
            this.$contextmenu({
                x: e.x,
                y: e.y,
                items: [{
                    label: 'Remove',
                    onClick: () => {
                        this.users.splice(this.users.indexOf(e.target.innerText), 1);
                    }
                }]
            });
        }
    }
}
</script>
<template>
    <div>
        <div>
            <label> {{ label }}</label>
            <slot></slot>
        </div>
        <div    v-for="user in users" 
                :key="user" 
                class="userSelectorElement"
                :class="{
                    darkSelector : theme === 'dark',
                    lightSelector: theme === 'light',
                }"
                @contextmenu="rightClick">
            {{ user }}
        </div>
        <input  type="text" 
                class="userSelectorElement"
                :class="{
                    darkSelector : theme === 'dark',
                    lightSelector: theme === 'light',
                }"
                @keydown.enter="addUser" ref="userSelectorInput">
        <input  class="userAddButton" 
                :class="{
                    darkSelector : theme === 'dark',
                    lightSelector: theme === 'light',
                }"
                type="button" 
                value="add" 
                @click="addUser">
    </div>
</template>
<style>
.userSelectorElement {
    width: 46vw;
    min-height: 24px;
    display: flex;
    padding-left: 5px;
    border: none;
}
.darkSelector {
    background-color: var(--open-uml-selection-dark-1);
    color: var( --vt-c-text-light-1);
}
.darkSelector:hover {
    background-color: var(--vt-c-dark-soft);
}
.lightSelector {
    color: var(--vt-c-dark-dark);
    background-color: var(--vt-c-white-soft);
}
.lightSelector:hover {
    background-color: var(--vt-c-white-mute);
}
input:focus {
    border: solid 2px;
    border-color: var(--vt-c-dark-soft);
}
.userAddButton {
    border: none;
    height: 2em;
    border-radius: 10px;
    margin-top: 5px;
}
</style>
