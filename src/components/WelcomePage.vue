<template>
    <div class="scrollable">
        <div class="welcomeText">
            Welcome to uml-cafe
        </div>
        <div class="information">
            <p>
                This is an alpha stage open source uml based modeling client. Create a Class Diagram, and model the structure of your systems or code. You can sign up and have your Projects saved in the cloud. Make sure to model with your friends in real time as well, just share your url.
            </p>
            <div style="text-align: center;">
                <video controls width="80%">
                    <source src="@/assets/demo_video_uml_cafe.webm" type="video/mp4">
                </video>
            </div>
            <p>
                Feel free to plug into your own code and automate your modeling as well with our open source APIs in c++ and javascript, here are all of them you can use with this tool!
            </p>
            <p>
                
            </p>
            <p>
                <a href="https://github.com/nemears/uml-cpp">uml-cpp</a> A versatile reconfigurable uml API that can be used in a C++ environment. It can interface with the same uml protocol as uml-client.
            </p>
            <p>
                <a href="https://github.com/nemears/uml-client">uml-client</a> The client API in javascript that allows interaction with a Project hosted using a reusable uml protocol.
            </p>
            <p>
                <a href="https://github.com/nemears/uml-cafe">uml-cafe</a> The vue based application built for the browser that allows interaction with a managed model in the backend. The diagramming ability is built upon bpmn.io's <a href="https://github.com/bpmn-io/diagram-js">diagram-js</a>. It holds some addition diagramming interfaces that may be useful for development.
            </p>
            <h2>Why uml.cafe?</h2>
            <ul>
                <li>Accurate to the uml 2.5.2 spec</li>
                <li>Made by a Systems Software Engineer with <a href="https://github.com/nemears/emory_mears_cv/blob/master/cv.pdf">4 years of experience</a></li>
                <li>It is completely free to use</li>
                <li>Open source api in C++ and javascript</li>
            </ul>
            <p>
                Have fun Modeling!
            </p>
            <p>
                <b>Contact:</b> emory@uml.cafe
            </p>
            <h2>Release Notes</h2>
            <h3>0.5.0</h3>
            <p>
                This is our first stable release! Class Diagrams are the only diagram currently while we work on setting up the rest of the diagrams.
            </p>
            <p>Known issues</p>
            <ul>
                <li>Context pad becomes unusable after some shapes are added</li>
                <li>Move central oriented labels on edges when edges move</li>
                <li>More to be added as we use the tool</li>
            </ul>
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
