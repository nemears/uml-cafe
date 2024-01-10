<template>
    <div class="scrollable">
        <div class="welcomeText">
            Welcome to uml-cafe
        </div>
        <div class="information">
            <p>
                This is an alpha stage open source uml based modeling client. Please be patient with development, or help us with it! There is so much to do! Be aware that the profile and code itself are subject to changes so any projects you create now may not be compatible easily with future versions. To start right click the Model in the element explorer to the left and start creating! 
            </p>
            <p>
                Check out these open source APIs you can use with this tool!
            </p>
            <p>
                <a href="https://github.com/nemears/uml-cafe">uml-cafe</a> The vue based application built for the browser that allows interaction with a managed model in the backend. The diagramming ability is built upon bpmn.io's <a href="https://github.com/bpmn-io/diagram-js">diagram-js</a>. It holds some addition diagramming interfaces that may be useful for development.
            </p>
            <p>
                <a href="https://github.com/nemears/uml-client">uml-client</a> The client API in javascript that allows interaction with a Project hosted using a reusable uml protocol.
            </p>
            <p>
                <a href="https://github.com/nemears/uml-cpp">uml-cpp</a> A versatile reconfigurable uml API that can be used in a C++ environment. It can interface with the same uml protocol as uml-client.
            </p>
            <p>
                Contact: emory@uml.cafe
            </p>
        </div>
    </div>
</template>
<style>
.scrollable {
    overflow-y: auto;
    padding: 10px;
    flex: 1 1 auto;
}
.welcomeText {
    font-size: 75px;
    text-align: center;
}
.information {
    font-size: 25px;
}
.information > p {
    margin: 1rem 0;
    width: auto;
}
a {
  color: rgb(113, 198, 255);
}
</style>
