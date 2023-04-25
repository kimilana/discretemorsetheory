
// Author: Jim Fix
// CSCI 385: Computer Graphics, Reed College, Spring 2022
//
// This, as it stands, is a WebGL program that displays the surfaces
// described in several Wavefront .OBJ file, made up of triangular
// facets. The surface's mesh components--- the vertices, edges, and
// faces-- are described as a "winged half-edge" data structure. This
// gives us a means for exploring these components' topological
// relationships with each other. It provides an oriented
// representation that makes the connectivity amongst the components
// navigable.

//
// The drawing part of the code occurs in `drawViews` and relies
// heavily on the `opengl.js` library. The surface is represented in
// the file `surface.js`. This includes code that "compiles" the
// surface (using `glBegin/glEnd`) so that it can be displayed both
// with shading and as a wireframe mesh.


let gSurfaces       = new Map();
let gSurfaceLibrary = new Map();
let gSurfaceChoice  = "tetra";
let gSurface        = null;
//
let gWidth = 640;
let gHeight = 640;
//
let gOrientation = quatClass.for_rotation(0.00, new Vector3d(1.0,0.0,0.0));
let gMouseStart  = {x: 0.0, y: 0.0};
//
let gLightOn       = true;
let gLightPosition = new Point3d(-1.5, 0.875, -1.0);
//
let gShowMesh      = true;
let gShowGradient      = true;
//
let gradient = "null";

function chooseSurface(objname) {
    gSurfaceChoice = objname;
    gSurface =  gSurfaces.get(gSurfaceChoice);
    gradient = "null";
}

function loadObjects() {

    // Load each of the surface options as .OBJ files for the radio buttons.
    //
    const rbs = document.querySelectorAll('input[name="surface"]');
    for (const rb of rbs) {
        //
        const objName = rb.value;
        const objFileName = objName + ".obj";
        const objFileText = document.getElementById(objFileName).text;
        gSurfaceLibrary.set(objName,objFileText);
        //
        rb.addEventListener("click", () => {
            chooseSurface(rb.value);
        });
    }
}


function makeEdgeObject() {
    const width = 0.6;
    const numFacets = 12;
    const dAngle = 2.0 * Math.PI / numFacets;
    const r = 0.015;

    glBegin(GL_TRIANGLES, "my-arrow", true);

    // Produce the top of the cylinder
    for (let i = 0; i < numFacets; i += 1) {
        const aTop = dAngle * i;
        const xTop0 = Math.cos(aTop) * (2 * r);
        const yTop0 = Math.sin(aTop) * (2 * r);
        const xTop1 = Math.cos(aTop + dAngle) * (2 * r);
        const yTop1 = Math.sin(aTop + dAngle) * (2* r);

        glColor3f(0.04, 0.32, 0.59);

/*
        if (i % 2 == 0) {
      glColor3f(1.0, 0.8, 0.0);
  } else {
      glColor3f(1.0, 0.8, 0.0);
  }

*/

        glVertex3f(0.0, 0.0, (width-0.2) / 2.0);
        glVertex3f(xTop0, yTop0, (width-0.2) / 2.0);
        glVertex3f(xTop1, yTop1, (width-0.2) / 2.0);
    }

    // Produce the sides of the cylinder
    for (let i = 0; i < numFacets; i += 1) {
        const aMid = dAngle * i;
        const xMid0 = Math.cos(aMid) * r;
        const yMid0 = Math.sin(aMid) * r;
        const xMid1 = Math.cos(aMid + dAngle) * r;
        const yMid1 = Math.sin(aMid + dAngle) * r;

    glColor3f(0.29, 0.57, 0.87);
  //glColor3f(1.0, 0.0, 0.0);
        glVertex3f(xMid0, yMid0,  width / 2.0);
        glVertex3f(xMid0, yMid0, -width / 2.0);
        glVertex3f(xMid1, yMid1, -width / 2.0);
    glColor3f(0.04, 0.32, 0.59);
	  //glColor3f(0.04, 0.32, 0.59);
        glVertex3f(xMid0, yMid0,  width / 2.0);
        glVertex3f(xMid1, yMid1, -width / 2.0);
        glVertex3f(xMid1, yMid1,  width / 2.0);
    }

    // Produce the bottom of the cylinder.
    for (let i = 0; i < numFacets; i += 1) {
        const aBottom = dAngle * i;
        const xBottom0 = Math.cos(aBottom) * r;
        const yBottom0 = Math.sin(aBottom) * r;
        const xBottom1 = Math.cos(aBottom + dAngle) * r;
        const yBottom1 = Math.sin(aBottom + dAngle) * r;

    glColor3f(0.29, 0.57, 0.87);

/*
    if (i % 2 == 0) {
	    glColor3f(1.0, 0.0, 0.0);
	} else {
	    glColor3f(1.0, 0.0, 0.0);
	}
*/

	glVertex3f(     0.0,      0.0, (-width) / 2.0);
        glVertex3f(xBottom0, yBottom0, (-width) / 2.0);
        glVertex3f(xBottom1, yBottom1, (-width) / 2.0);
    }

    // Produce the cone for the point
    for (let i = 0; i < numFacets; i += 1) {
        const aTop = dAngle * i;
        const xTop0 = Math.cos(aTop) * (2 * r);
        const yTop0 = Math.sin(aTop) * (2 * r);
        const xTop1 = Math.cos(aTop + dAngle) * (2 * r);
        const yTop1 = Math.sin(aTop + dAngle) * (2 * r);

  glColor3f(0.04, 0.32, 0.59);


/*
        if (i % 2 == 0) {
      glColor3f(1.0, 0.8, 0.0);
  } else {
      glColor3f(1.0, 0.8, 0.0);
  }
*/
       glVertex3f(  0.0,   0.0 , (width-0.2) /2 + 0.2);
        glVertex3f(xTop0 , yTop0 , (width-0.2) /2);
        glVertex3f(xTop1 , yTop1 , (width-0.2) /2);
    }

    glEnd();
}



function makeObject(objname, objtext) {
    /*
     * Processes the Wavefront .OBJ file information stored in
     * the string `objtext`. It builds a `Surface` instance for
     * it. It then creates two `glBeginEnd` renderings:
     *
     *  "object": is the triangular facets of the object,
     *            using a surface material that is a mix of
     *            the ground color, and the cycle trails'
     *            colors.
     *
     *  "object-mesh": description of all the edges of the
     *                 faceted object.
     *
     * In the above, "object" stands in for `objname`.
     *
     */

    const surface = new Surface(objname);
    surface.read(objtext);

        //
        // Make faceted object.
        surface.glCompile() // a series of trios of glVertex3f

        //
        // Make the wireframe.
        surface.glCompileMesh() // a series of pairs of glVertex3f

    //
    // Include amongst surfaces.
    gSurfaces.set(objname,surface);
}



function drawEdgeObject(v1, v2, up, scale) {
  let l = v1.combo(0.5, v2); //location
  glPushMatrix();
  glTranslatef(l.x, l.y, l.z);
  glScalef(scale, scale, scale);
  let toward = (v2.minus(v1)).unit();
  ifkReorient(toward, up.unit());
  glBeginEnd("my-arrow");
  glPopMatrix();
}


function drawEdges() {
  if(gradient == "null") {
    gradient = gSurface.forman_gradient();
  }

  let edgelist = [];

  //for (let e of gSurface.allEdges()) {

  for(let pair of gradient) {

    if(pair.type == 0) {

    let e = pair.edge;
    edgelist.push(e);
    //if(e.id == "0;1") {
    //if(!(edgelist.includes(e.twin)) ) {
    //if(e.source.id < e.target.id || e.twin == null) {
    let v1 = e.source.position;
    let v2 = e.target.position;
    let vec = (v1).minus(v2);
    let scale = vec.norm();
    drawEdgeObject(v1, v2, e.face.getNormal(), scale);
  }

  //}
  //}

  if(pair.type == 1) {
  //for (let f of gSurface.allFaces()) {
      let f = pair.face;
      let edge = pair.edge;
      let points = f.getPoints();
      let fv1 = points[0];
      let fv2 = points[1];
      let fv3 = points[2];
      let center = new Point3d((fv1.x + fv2.x  + fv3.x ) /3, (fv1.y + fv2.y + fv3.y ) /3, (fv1.z + fv2.z + fv3.z)/3);
      let p1 = edge.source.position.combo(0.5, edge.target.position);
      let fvec = p1.minus(center);
      let fscale = 1.65 * fvec.norm();
      drawEdgeObject(p1, center, f.getNormal(), fscale);
    }

  //}
}

}


function drawObject() {
    /*
     * Renders the object within the WebGL/UT context.
     *
     * Uses Phong shading (set by GL_LIGHTING) illuminated by a
     * single light, GL_LIGHT0.
     *
     */

    // Turn on lighting.
    glEnable(GL_LIGHTING);
    if (gLightOn) {
	    glEnable(GL_LIGHT0);
    }
    glLightfv(GL_LIGHT0, GL_POSITION, gLightPosition.components());

    // Render the object in the selected style.
    gSurface.glRender();

    glDisable(GL_LIGHT0);
    glDisable(GL_LIGHTING);
}


function drawWireframe() {
    /*
     * Renders a wireframe mesh of the object within the WebGL/UT context.
     *
     */
    glColor3f(0.95,0.9,0.5);
    gSurface.glRenderMesh();
}


function drawObjectView() {

    // Clear the transformation stack.
    glMatrixMode(GL_MODELVIEW);
    glLoadIdentity();

    // Draw the object and the cycles.
    //
    glPushMatrix();
    {

        // Sit back a little from the object, fit it with some margin.
        //
        //glTranslatef(-1.0,0.0,0.0);
        glScalef(0.9,0.9,0.9);

	    // Transform by the current trackball oriention.
        //
	    gOrientation.glRotatef();

        // Render the surface.
	    drawObject();
	    if (gShowMesh) {
	        drawWireframe();
	    }

        //Draw all the arrows on the edges
      if(gShowGradient) {
        drawEdges();
      }
    }
    glPopMatrix();
}


function drawViews() {
    /*
     * Issue GL calls to draw the scene.
     */

    // Clear the rendering information.
    glClearColor(1.0,1.0,1.0);
    //glClearColor(0.2,0.2,0.3);
    glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
    glEnable(GL_DEPTH_TEST);

    // Draw the full-object view on the left.
    //glEnable(GL_SCISSOR_TEST);
    //glScissor(0, 0, gWidth - gHeight, gHeight);
    drawObjectView();
    //glDisable(GL_SCISSOR_TEST);


    /*
    // Draw the on-surface view on the right.
    glEnable(GL_SCISSOR_TEST);
    glScissor(gHeight, 0, gHeight, gHeight);
    glDisable(GL_SCISSOR_TEST);
    */

    // Render everything.
    glFlush();
}

function handleKey(key, x, y) {
    /*
     * Handle a keypress.
     */

  //display the gradient
  if (key == "g") {
    gShowGradient = !gShowGradient;
  }
  if (key == "f") {
    gSurface.forman_gradient();
  }

    // Turn wireframe on/off.
    if (key == "w") {
	    gShowMesh = !gShowMesh;
    }

    glutPostRedisplay();
}

function worldCoords(mousex, mousey) {
    const pj = mat4.create();
    glGetFloatv(GL_PROJECTION_MATRIX,pj);
    const pj_inv = mat4.create();
    mat4.invert(pj_inv,pj);
    const vp = [0,0,0,0];
    glGetIntegerv(GL_VIEWPORT,vp);
    const mousecoords = vec4.fromValues(2.0*mousex/vp[2]-1.0,
					                    1.0-2.0*mousey/vp[3],
					                    0.0, 1.0);
    vec4.transformMat4(location,mousecoords,pj_inv);
    return {x:location[0], y:location[1]};
}

function handleMouseClick(button, state, x, y) {
    /*
     * Records the location of a mouse click in object world coordinates.
     */

    // Start tracking mouse for trackball/light motion.
    mouseStart  = worldCoords(x,y);
    mouseButton = button;
    if (state == GLUT_DOWN) {
	    mouseDrag = true;
    } else {
	    mouseDrag = false;
    }
    glutPostRedisplay()
}

function handleMouseMotion(x, y) {
    /*
     * Reorients the object based on the movement of a mouse drag.
     *
     * Uses last and current location of mouse to compute a trackball
     * rotation. This gets stored in the quaternion gOrientation.
     *
     */

    // Capture mouse's position.
    mouseNow = worldCoords(x,y)

    // Update object/light orientation based on movement.
    dx = mouseNow.x - mouseStart.x;
    dy = mouseNow.y - mouseStart.y;
    axis  = (new Vector3d(-dy,dx,0.0)).unit()
    angle = Math.asin(Math.min(Math.sqrt(dx*dx+dy*dy),1.0))
    gOrientation = quatClass.for_rotation(angle,axis).times(gOrientation);

    // Ready state for next mouse move.
    mouseStart = mouseNow;

    // Update window.
    glutPostRedisplay()
}

function resizeWindow(w, h) {
    /*
     * Register a window resize by changing the viewport.
     */
    glViewport(0, 0, w, h);
    glMatrixMode(GL_PROJECTION);
    glLoadIdentity();

    // Note: We're using a right-handed coordinate system here.
    if (w > h) {
        glOrtho(-w/h, w/h, -1.0, 1.0, -1.0, 1.0);
    } else {
        glOrtho(-1.0, 1.0, -h/w * 1.0, h/w * 1.0, -1.0, 1.0);
    }
}


function viewer() {
    /*
     * The main procedure, sets up GL and GLUT.
     */

     // MAKE EDGE OBJECT
    makeEdgeObject();

    // set up GL/UT, its canvas, and other components.
    glutInitDisplayMode(GLUT_SINGLE | GLUT_RGB | GLUT_DEPTH);
    glutInitWindowPosition(0, 0);
    glutInitWindowSize(gWidth, gHeight);
    glutCreateWindow('Discrete Morse Theory Visualizations');
    //
    resizeWindow(gWidth, gHeight); // It seems to need this.


    // Build the renderable objects.
    loadObjects();
    for (const objname of gSurfaceLibrary.keys()) {
        console.log(objname);
        const objtext = gSurfaceLibrary.get(objname);
        makeObject(objname,objtext);
    }

    // Set up the initial surface.
    chooseSurface(gSurfaceChoice);

    // Register interaction callbacks.
    glutKeyboardFunc(handleKey);
    glutReshapeFunc(resizeWindow);
    glutDisplayFunc(drawViews);
    glutMouseFunc(handleMouseClick);
    glutMotionFunc(handleMouseMotion);

    // Go!
    glutMainLoop();

    return 0;
}


glRun(() => { viewer(); }, true);
