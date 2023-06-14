<script>
export default {
    props: ['label'],
    data() {
        return {
            users: []
        }
    },
    methods: {
        addUser() {
            const userValue = this.$refs.userSelectorInput.value;
            if (userValue === undefined || userValue === '') {
                // maybe show error to user
                return;
            }

            // check if user exists
            // TODO

            this.users.push(userValue);
            this.$refs.userSelectorInput.value = '';
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
                        this.users = this.users.filter(u => u !== e.target.innerText);
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
        <div v-for="user in users" :key="user" class="userSelectorElement" @contextmenu="rightClick">
            {{ user }}
        </div>
        <input type="text" class="userSelectorElement" @keydown.enter="addUser" ref="userSelectorInput">
        <input class="userAddButton" type="button" value="add" @click="addUser">
    </div>
</template>
<style>
.userSelectorElement {
    width: 46vw;
    background-color: var(--open-uml-selection-dark-1);
    min-height: 24px;
    display: flex;
    padding-left: 5px;
    border: none;
    color: var( --vt-c-text-light-1);
}
.userSelectorElement:hover {
    background-color: var(--vt-c-dark-soft);
}
input:focus {
    border: solid 2px;
    border-color: var(--vt-c-dark-soft);
}
.userAddButton {
    background-color: var(--open-uml-selection-dark-1);
    border: none;
    color: var( --vt-c-text-light-1);
    height: 2em;
    border-radius: 10px;
    margin-top: 5px;
}
.userAddButton:hover {
    background-color: var(--vt-c-dark-soft);
}
</style>