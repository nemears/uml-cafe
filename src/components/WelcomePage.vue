<template>
    <div class="scrollable">
        <div class="welcomeText">
            Welcome to uml-cafe
        </div>
        <div class="information">
            <p>
                This is an alpha stage open source, free to use, uml modeling client. Create a Class Diagram, and model the structure of your systems or code. You can sign up and have your Projects saved in the cloud. Make sure to model with your friends in real time as well, just share your url.
            </p>
            <h2>
                Contents
            </h2>
            <p>
                <ul>
                    <li>
                        <a href="#HowToUse">How To Use</a>
                        <ul>
                            <li>
                                <a href="#element_explorer">Element Explorer</a>
                            </li>
                            <li>
                                <a href="#specification_page">SpecificationPage</a>
                            </li>
                            <li>
                                <a href="#class_diagrams">Class Diagrams</a>
                            </li>
                        </ul>
                    </li>
                    <li>
                        <a href="#0_5_0_demo">0.5.0 Demo Video</a>
                    </li>
                    <li>
                        <a href="#apis_and_software">APIs and Software Resources</a>
                    </li>
                    <li>
                        <a href="#known_issues">Known Issues</a>
                    </li>
                    <li>
                        <a href="#release_notes">Release Notes</a>
                    </li>
                    <li>
                        <a href="#contact">Contact and Legal</a>
                    </li>
                </ul>
            </p>
            <h1 id="HowToUse">
                How To Use
            </h1>
            <p>
                This is a brief explanation of some of the features and how to use this tool. <b>This is not a UML Tutorial</b> and will assume that you know atleast the basic ideas of UML structure. The features within this software also don't encompass the entirety of what UML can model yet, but it does encompass most structural elements within UML. The following is broken up into the features you can use to model one by one.
            </p>
            <h2 id="element_explorer">
                Element Explorer
            </h2>
            <p>
                The Element Explorer to the left is how you can quickly navigate the model. Click the "+" icon next to the Elements shown to reveal the element's owned elements underneath. Right click to see options that each type has. Many types create an element, right now we just have structure elements so much of what you will be creating is Packages and Classes.
            </p>
            <p>
                A Package is used to create the organizational structure of your model. Right click the package in the element explorer and click "Rename" to name the Package. Right click and hover "Create Element" to see what sort of elements you can create. There are a lot of types but to start you will probably be creating a Class.
            </p>
            <figure>
                <img src="https://share.uml.cafe/element_explorer_right_click.png" style="width:90%;"/>
                <figcaption> 
                    A screenshot of an element within the Element Explorer with the context menu (right click menu) shown. The options in the first section of menu are: Specification, Rename, Create Class Diagram, Create Element and Delete. The second menu (a continuation of the Create Element Option displays some of many options, displayed are: Create Package, Create Class, Create DataType, Create Primitive Type, Create Association.
                </figcaption>
            </figure>
            <p>
            A Class is used to define type information for your model. This is useful to generate meta code and apis from your model (see <a href="#uml_client_info">uml-client</a> / uml-cpp), as well as to create your own meta types for use within the client. To see a more detailed view of the class you can double click the class to see the Specification Page.
            </p>
            <h2 id="specification_page">
                Specification Page
            </h2>
            <p>
                The Specification displays the complete information contained within every element of the model. Everything within the model is a BaseElement and has a unique ID. Most UML types are also of the type NamedElement. A NamedElement has a name that can be used to easily recognize elements, as well as search within the model using the search bar at the top of the Element Explorer. All Types that an element is will be shown within the specification, click type text (e.g. NamedElement, Element etc...) to show and reveal the data associated with it.
            </p>
            <p>
                You can create elements from within the Specification Page. Any property shown that has a "+" icon on the right or says, "double click to create element", is a property that can be simply added to. These properties are composite meaning they own the elements being created. Clicking the "+" button brings up an Element Creator window, scroll to see all the types you can create. Double click one to create it and you will see it appear within the property as well as any subsetted or redefined properties that are related to this one.
            </p>
            <p>
                There are certain properties that can still be edited but are not composite. To set these drag an element from the ElementExplorer into the area containing the Property information. If it is allowed the Property area will be highlighted blue. If it is red it is not allowed. This is useful for setting the Type of a Property, or a member end of an Association.
            </p>
            <figure>
                <img src="https://share.uml.cafe/specification_drag.png" style="width: 90%"/>
                <figcaption>
                    A Primitive Type (String) being dragged from the Element Explorer into the Specification Page of a Property in order to set the Property's type property. The type property is highlighted blue showing that the String Primitive Type is a valid element to set the Property's type as.
                </figcaption>
            </figure>
            <h2 id="class_diagrams">
                Class Diagrams
            </h2>
            <p>
                To quickly create information associated from classes it is useful to put the information into a diagram. Right click a Package and you should see the option "Create Class Diagram". This should show a new blank canvas with a Palette of UML types. Drag a Class that you have already made from the Element Explorer into the editor area of the Class Diagram, you should see the outline of your shape show up. Let go and your Class is now represented as a shape on the Diagram.
            </p>
            <figure>
                <img src="https://share.uml.cafe/diagram_drag.png" style="width:90%;"/>
                <figcaption>
                    A screenshot of a user dragging the class named Foo with Property bar of type String into a Class Diagram. An outline of the eventual shape that will appear when dropped is previewed on the Diagram.
                </figcaption>
            </figure>
            <p>
                More Classes can quickly be made by clicking the Orange square Class icon at the top left of the palette. Click again to place a brand new class within the diagram. It should be created in the same Package that the diagram is in. Right click the package to rename it. If you want to show inheritance click the arrow with the seethrough head to create a Generalization. Connect to classes by clicking the child class first and then the parent.
            </p>
            <p>
                You can also create properties by creating an Association between two classes. An association also provides extra information on the relation between that property and a possible "opposite" property in another class. There are many types of associations based on the combination of aggregation and ownership, the last four relationships in the property create standard types of Associations. A composite relationship generally signifies ownership, and a dot at the end of an association signals that the property is owned by the element at the opposite side of the Association. This will all come naturally in time with using the application.
            </p>
            <p>
                If you want to better convey the visuals of your Diagram you can right click the shapes and select "Customize Shape" This will bring up a Specification Page for the Style of the shape. Feel free to change the text style, as well as the colors of your shape.
            </p>
            <h1 id="0_5_0_demo">
                0.5.0 Demo Video
            </h1>
            <div style="text-align: center;">
                <video controls width="80%">
                    <source src="https://share.uml.cafe/demo_video_0_5_0.webm" type="video/mp4">
                </video>
            </div>
            <br/>
            <h1 id="apis_and_software">
                API's and Software Resources
            </h1>
            <p>
                Feel free to plug into your own code and automate your modeling as well with our open source APIs in c++ and javascript, here are all of them you can use with this tool!
            </p>
            <p id="uml_client_info">
                <a href="https://github.com/nemears/uml-client">uml-client</a> The client API in javascript that allows interaction with a Project hosted using a reusable uml protocol. Can generate usable code using the <code>generate</code> function which will create relative javascript types and properties according to the uml spec in the project.
            </p>
            <p>
                <a href="https://github.com/nemears/uml-cpp">uml-cpp</a> A versatile reconfigurable uml API that can be used in a C++ environment. It can interface with the same uml protocol as uml-client.
            </p>
            <p>
                <a href="https://github.com/nemears/uml-cafe">uml-cafe</a> The vue based application built for the browser that allows interaction with a managed model in the backend. The diagramming ability is built upon bpmn.io's <a href="https://github.com/bpmn-io/diagram-js">diagram-js</a>. It holds some addition diagramming interfaces that may be useful for development.
            </p>
            <br/>
            <h1 id="known_issues">Known issues</h1>
            <ul>
                <li>Context pad becomes unusable after some shapes are added</li>
                <li>Move central oriented labels on edges when edges move</li>
                <li>... More to be added as we use the tool</li>
            </ul>
            <p>Did you find an issue? Submit it to our issues list <a href="https://github.com/nemears/uml-cafe/issues">here</a>!</p>
            <br/>
            <h1 id="release_notes">Release Notes</h1>
            <h3>0.5.9</h3>
            <p>
                Moved video and additional resources to https server "share.uml.cafe". Added Privacy Policy.
            </p>
            <h3>0.5.8</h3>
            <p>
                Control Panel added to Element Explorer, can now search and filter elements withn the model.
            </p>
            <h3>0.5.7</h3>
            <p>
                Re-implementation of Specification page with new uml-client api using TypeInfo. Diagram Styles implemented with special spec page and color selector
            </p>
            <h3>0.5.6</h3>
            <p>
                Refactored directory layout for repository. Added multiplicity selector. Switched to new generated api for handling diagrams
            </p>
            <h3>0.5.5</h3>
            <p>
                Fixed dump method within umlClient to save files correctly
            </p>
            <h3>0.5.4</h3>
            <p>New config option for customizing between builds</p>
            <h3>0.5.3</h3>
            <p>New light dark theme toggle and fixed problem with api login and sessionStorage</p>
            <h3>0.5.2</h3>
            <p>Tab updates so that tabs can be moved around and reordered. Updated uml-client to have more secure api.</p>
            <h3>0.5.1</h3>
            <p>Added a throbber when loading diagrams so user cannot mess with incomplete state. Fixed Bugs with edges, properties and persistence.</p>
            <h3>0.5.0</h3>
            <p>
                This is our first stable release! Class Diagrams are the only diagram currently while we work on setting up the rest of the diagrams.
            </p>
            <br/>
            <h1 id="contact">
                Contact and Legal
            </h1>
            <p>
                <b>Contact:</b> em@uml.cafe
            </p>
            <p>
                <b>Legal Documents: </b><a href="https://share.uml.cafe/privacy_policy.html">Privacy Policy</a>
            </p>
            <p>
                <b>Have fun Modeling!</b>
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
.information > p > b {
    font-weight: bold;
}
a {
  color: rgb(113, 198, 255);
}
figcaption {
    color: gray;
    font-size: small;
}
</style>
