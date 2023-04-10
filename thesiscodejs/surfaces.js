
// Author: Jim Fix
//
//
// This defines a class for representing a triangular mesh surface
// class, one that uses a winged half-edge data structure.
//

EPSILON = 1.0e-8


class DirectedHasse {
  constructor(simplices, pairs, gradient) {
      this.nodes = new Map();
      for(let i = 0; i < simplices.length; i++) {
        this.nodes.set(simplices[i], i);
      }
      this.numNodes = simplices.length;
      this.pairs = pairs;
      this.gradient = gradient;
      this.init_matrix();
      this.init_closure();
  }

  init_matrix() {
  this.matrix = new Array(this.numNodes);
  for(let i = 0; i < this.numNodes; i++) {
       this.matrix[i] = new Array(this.numNodes);
       for(let j = 0; j < this.numNodes; j++) {
          this.matrix[i][j] = 0;
       }
     }
     this.set_hasse_matrix();
  }

  init_closure() {
  this.closure = new Array(this.numNodes);
  for(let i = 0; i < this.numNodes; i++) {
       this.closure[i] = new Array(this.numNodes);
       for(let j = 0; j < this.numNodes; j++) {
          this.closure[i][j] = this.matrix[i][j];
       }
       this.closure[i][i] = 1;
     }
     this.set_hasse_closure();
  }

  set_hasse_matrix() {
    for(let p of this.pairs) {
      if(p.type == 0) { //edge-vertex pair
        let e = this.nodes.get(p.edge);
        let v = this.nodes.get(p.vertex);
        this.matrix[e][v] = 1; //downward arrow from edge to face
      }
      if(p.type == 1) { //face-edge pair
        let f = this.nodes.get(p.face);
        let e = this.nodes.get(p.edge);
        this.matrix[f][e] = 1; //downward arrow from face to edge
      }
    }
    //reverse the arrows on the gradient
    for(let g of this.gradient) {
      if(g.type == 0) { //edge-vertex pair
        let e = this.nodes.get(g.edge);
        let v = this.nodes.get(g.vertex);
        this.matrix[e][v] = 0;
        this.matrix[v][e] = 1; //upward arrow from vertex to edge
      }
      if(g.type == 1) { //face-edge pair
        let f = this.nodes.get(g.face);
        let e = this.nodes.get(g.edge);
        this.matrix[f][e] = 1;
        this.matrix[e][f] = 1; //upward arrow from edge to face
      }
    }
  }

  set_hasse_closure() {
    //initialize paths between nodes connected by 1 edge
    //and between a node and itself
    let n = this.numNodes;
    for(let i = 0; i < n; i++) {
      for(let j = 0; j < n; j++) {
        if(this.matrix[i][j] == 1) { //1-edge paths
          this.closure[i][j] == 1;
        }
        this.closure[i][i] == 1;
      }
      for(let k = 0; k < n; k++) {
        for(let i = 0; i < n; i++) {
          for(let j = 0; j < n; j++) {
            if(this.closure[i][k] == 1 && this.closure[k][j] == 1) {
              this.closure[i][j] == 1;
            }
          }
        }
      }

    }
  }

  insert(i,j) {
    this.matrix[i][j] = 1;
    if(this.closure[i][j] == 0) {
      for(k = 0; k < n; k++) {
        if(this.closure[k][j] == 0 && this.closure[k][i] == 1) {
          this.closure.adapt(j,k)
        }
      }
    }
  }

  adapt(j,k) {
    let marked = new Array(this.numNodes);
    for(let i = 0; i < this.numNodes; i++) {
      marked[i] = false;
    }
    marked[j] = true;
    let Q = [];
    Q.push(j);
    while(!Q.length == 0) {
      let l = Q.pop();
      for(let m = 0; m < this.numNodes; m++) {
        if(this.matrix[l][m] == 1) { //if there is an edge from l to m
          if(this.closure[k][m] == 0 && !marked.includes(m)) {
            this.closure[k][m] = 1;
            marked[m] = true;
            Q.push[m];
          }
        }
      }
    }
  }

  delete() {

  }


}



//
// class Vertex
//
// Describes a corner of a mesh at a position in 3D space.
//
// A vertex knows one of its outgoing edges.
//
// A vertex can be identifed within a surface by its `id`.
//
// NOTE: You typically don't create a vertex directly. Rather, you use
// the `Surface.makeVertex` method.
//
// See the code in `Surface`.
//
// ========
//
class Vertex {

    constructor(id,P) {
        //
        // Construct a new vertex at position `P : Point3d` identified by
        // `id` within the surface.
        //
        this.id = id;
        this.position = P;
        this.edge = null;

        // Suggested attribute for the `subdivide` method.
        //
        this.clone = null;
    }

    setEdge(e) {
        //
        // Register some outgoing surface edge from this vertex.
        //
        this.edge = e;
    }

    fixEdge() {
        //
        // For surfaces where a vertex might sit on a surface boundary,
        // traverse the fan of edges so that `this.edge` is the earliest
        // one on the counter-clockwise ordering around the vertex.
        //
        // In other words, set `this.edge` so that a series of
        // `prev.twin` steps will hit each of the edges around a
        // vertex in CCW order.
        //
        console.assert(this.edge != null);
        const e = this.edge;
        while (this.edge.twin != null && this.edge.twin.next != e) {
            this.edge = this.edge.twin.next;
        }
    }

}

//
// class Edge
//
// Describes an oriented connection between two vertices on a surface,
// from a `source` vertex to a `target` vertex. An edge sits around the
// border of an oriented face. The `next` edge continues around that border,
// and the `prev` edge sits behind.
//
// Every edge has a `face` to its left of which it forms the border.
//
// Edges are actually `half edges`. If they serve as the hinge between two
// faces, then they have a `twin` edge that points in the opposite direction
// between the same two vertices.
//
// ========
//
// PROGRAM 6 INFO: I've included a `split` attribute that can be set
//                 to refer to a new vertex created from this edge
//                 as a result of splitting it during subdivision.
//
// NOTE: You typically don't create an edge directly. Rather, you use
// the `Surface.makeFace` method. That code creates a series of edges
// around a face, linking them together. This `makeFace` code also
// figures out the twinning of edge pairs, and relies on `makeEdge` to
// do that work.
//
// See the code in `Surface`.
//
// ========
//
class Edge {

    constructor(id, v0, v1) {
        // Constructs an edge from vertex `v0` to vertex `v1`.
        //
        // The edge is identifiable within the surface by its `id`.
        //
        this.id = id;
        this.source = v0;
        v0.setEdge(this); // Sets/updates an outgoing edge for the source.
        this.target = v1;

        //
        // It will be tied together with other surface components later.
        this.next = null;
        this.prev = null;
        this.face = null;
        this.twin = null;

        // Suggested attribute for the `subdivide` method.
        //
        this.split = null;
    }

    setNext(e) {
        //
        // Stitch this together with its successor along a face's border.
        //
        // (This is doubly-linked circular list insertion, essentially.)
        //

        this.next = e;
        e.prev = this;
    }

    setTwin(e) {
        //
        // Tie this edge with its "twin" that borders the neighboring
        // face.
        //

        this.twin = e;
        e.twin = this;
    }

    setFace(f) {
        //
        // Associate this edge with the face it borders.
        //

        this.face = f;
        f.edge = this;
    }

    getVector() {
        //
        // Returns a vector corresponding to the direction from the `source`
        // to the `target` vertex positions, a Vector3d.
        //

        return this.target.position.minus(this.source.position);
    }

    getPoints() {
        //
        // Returns the ordered pair of `source` and `target` positions
        // as an array of size 2.
        //

        const p0 = this.source.position;
        const p1 = this.target.position;
        return [p0,p1];
    }


}

//
// class Face
//
// Describes a CCW-oriented (triangular) facet of a surface mesh. Relies heavily
// on the `Edge` object to describe its topological relationship with the
// vertices of the mesh, including its three vertices.
//
// A face is described by a cycle of (three) edges, with each edge
// spanning two (of the three) vertices that form the face.
//
// A face has an `id` for identifying it within its surface.
//
// ========
//
//
// NOTE: You typically don't create a face directly. Rather, you use
// the `Surface.makeFace` method feeding it the identifiers of three
// vertices already created for that surface.
//
// See the code in `Surface`.
//
// ========
//
class Face {
    constructor(e01, e12, e20, id) {
        //
        // Construct a face from three oriented edges.
        //

        this.edge = e01;
        e01.setNext(e12);
        e12.setNext(e20);
        e20.setNext(e01);
        e01.setFace(this);
        e12.setFace(this);
        e20.setFace(this);
        this.normal = null; // See `getNormal` below.
        this.id = id;
    }

    getNormal() {
        //
        // Compute and return the unit vector normal to this
        // face according to its edges' CCW orientation.
        //

        if (this.normal == null) {
            const v1 = this.edge.getVector();
            const v2 = this.edge.prev.getVector().neg();
            // Right hand rule around the face.
            this.normal = v1.cross(v2).unit();
        }
        return this.normal;
    }

    getPoints() {
        //
        // Returns the ordered triple of vertex positions around the
        // face as an array of size 3.
        //

        const p0 = this.edge.prev.target.position;
        const p1 = this.edge.target.position;
        const p2 = this.edge.next.target.position;
        return [p0,p1,p2];
    }

    getUnorientedEdges(){
      //
      // Returns the three faces of the triangle
      // Where only one half-edge is considered
      //

      let f = this;

      let e1 = f.edge;
      let e2 = f.edge.next;
      let e3 = f.edge.prev;
      // want to only use one of the half edges
      if( (e1.source.id > e1.target.id) && e1.twin != null) {
        e1 = e1.twin;
      }
      if((e2.source.id > e2.target.id) && e2.twin != null) {
        e2 = e2.twin;
      }
      if((e3.source.id > e3.target.id) && e3.twin != null) {
        e3 = e3.twin;
      }
      return [e1, e2, e3];
    }
}


//
// class Surface
//
// This is the top-level class that houses the winged, half-edge data structure
// describing an oriented surface made up of (triangular) facets. Each facet consists
// of an ordered sequence of half-edges that form its border, with each half-edge
// being an ordered pair of vertices. Each vertex sits a Point3d position in space.
//
// To manage the construction of this surface mesh, a `Surface` object contains
//
//  * a id -> Vertex map of all of its Vertex components
//  * an id x id -> Edge map of all of its (half-) Edge components.
//  * an array of all of its Face components.
//
// In typical use, a programmer can build all `n` vertices of a surface by calling
// `makeVertex`. By default the `id` of each vertex is an integer from `0` to `n-1`
// in order of their creation.
//
// And then the programmer can describe each of the (oriented) faces by calling
// `makeFace` by providing three vertex `id`s. Under the covers, `makeFace` ties
// all the components together by stitching a face and its half-edges with the
// three vertices.
//
// ========
//

class Surface {

    constructor(name,level=0) {
        //
        // Build an empty surface mesh, preparing it to take vertices,
        // edges, and faces.
        //
        // name:  a string for the surface (usually its base file name.
        // level: number of subdivisions that led to its construction.
        //
        this.vertices = new Map();
        this.numVertices = 0;        // Count used for vertex IDs.
        this.edges = new Map();
        this.faces = [];
        this.numEdges = 0;
        this.nameBase = name;
        this.level = level;
    }

    getName() {
        //
        // Returns the (base) name string of this surface.
        //
        return this.nameBase;
    }

    getFace(fid) {
        //
        // Returns a face from its identifier.
        //
        console.assert(0 >= fid && fid < this.faces.length);
        return this.faces[fid];
    }

    getVertex(vid) {
        //
        // Returns a vertex from its identifier.
        //
        console.assert(this.vertices.has(vid));
        return this.vertices.get(vid);
    }

    getEdge(eid) {
        //
        // Returns an edge from its identifier.
        //
        console.assert(this.edges.has(eid));
        return this.edges.get(eid);
    }

    allVertices() {
        //
        // Returns an iterator for all the vertices of this surface.
        //
        return this.vertices.values();
    }

    allEdges() {
        //
        // Returns an iterator for all the edges of this surface.
        //
        return this.edges.values();
    }

    allFaces() {
        //
        // Returns an iterator for all the faces of this surface.
        //
        return this.faces;
    }

    makeVertex(P,id=null) {
        //
        // Adds a new vertex to the surface mesh at position `P : Point3d`.
        //
        // Typically numbers the vertex according to when it was added.
        //
        if (id == null) {
            id = this.numVertices;
        }
        this.numVertices++;
        const v = new Vertex(id,P);
        this.vertices.set(id,v);
        return v;
    }

    makeEdge(vi0, vi1) {
        //
        // Adds a new half-edge to the surface from/to the given vertices.
        // NOTE: The vertices are specified by their IDs.
        //
        // Identifies an edge by a string of its vertex ID pair.
        //
        console.assert(this.vertices.has(vi0));
        console.assert(this.vertices.has(vi1));
        const v0 = this.getVertex(vi0);
        const v1 = this.getVertex(vi1);
        const eid = vi0.toString() + ";" + vi1.toString();
        const tid = vi1.toString() + ";" + vi0.toString();
        const e = new Edge(eid,v0,v1);
        this.edges.set(eid,e);
        if (this.edges.has(tid)) {
            const t = this.getEdge(tid);
            e.setTwin(t);
        }
        return e;
    }

    countEdges() {
      let num = 0;
      for(let e of this.allEdges()) {
      if( (e.source.id < e.target.id) || e.twin == null) {
        num++
      }
      }
      return num;
    }

    makeFace(vi0,vi1,vi2,id=null) {
        //
        // Adds a new oriented triangular face around the given vertices.
        // NOTE: The vertices are specified by their IDs.
        //
        // Typically numbers the face based on the order it is added.
        //
        console.assert(this.vertices.has(vi0));
        console.assert(this.vertices.has(vi1));
        console.assert(this.vertices.has(vi2));
        const e01 = this.makeEdge(vi0,vi1);
        const e12 = this.makeEdge(vi1,vi2);
        const e20 = this.makeEdge(vi2,vi0);
        if (id == null) {
            id = this.faces.length;
        }
        const f = new Face(e01,e12,e20,id);
        this.faces.push(f);
        return f;
    }


// ******************************************************
// DMT ALGORITHMS

// We can use the height function f(vertex) = vertex.y as our function in the Forman gradient algorithm

forman_gradient() {

  const S = this;  //S is the surface

  function get_simplices() {
    let simplices = [];
    for (let v of S.allVertices()) {
      simplices.push(v);
    }
    for (let e of S.allEdges()) {
      if( (e.source.id < e.target.id) || e.twin == null) {
        simplices.push(e)
      }
    }
      for (let f of S.allFaces()) {
        simplices.push(f);
    }
    return simplices;
  }

  //returns a list of face-vertex pairs of a surface
  function edge_vertex_pairs() {
    let pairs = [];
    for (let e of S.allEdges()) {
      if( (e.source.id < e.target.id) || e.twin == null) {
      let v1 = e.source;
      let v2 = e.target;
      pairs.push({type: 0, vertex: v1, edge: e});
      pairs.push({type: 0, vertex: v2, edge: e});
    }
    }
    return pairs;
  }

  //returns a list of edge-face pairs of the surface
  function face_edge_pairs() {
    let pairs = [];
    for (let f of S.allFaces()) {
      let edges = f.getUnorientedEdges();
      let e1 = edges[0];
      let e2 = edges[1];
      let e3 = edges[2];
      pairs.push({type: 1, edge: e1, face: f});
      pairs.push({type: 1, edge: e2, face: f});
      pairs.push({type: 1, edge: e3, face: f});
    }
    return pairs;
  }


  //computes the weight of an edge
  //where the weight is the mean of the values of the vertices
  function compute_edge_mean(e) {
    let v1_val = e.source.position.y;
    let v2_val = e.target.position.y;
    return (0.5 * (v1_val + v2_val));
  }

  //computes the weight of a face
  function compute_face_mean(f) {
     let vertex_pos = f.getPoints();
     let v1_val = vertex_pos[0].y;
     let v2_val = vertex_pos[1].y;
     let v3_val = vertex_pos[2].y;
     return ( (v1_val + v2_val + v3_val) / 3 );
  }

  //returns a list of each pair and its weight
  function edge_vertex_weights() {
    let pairs_weights = [];
    let pairs = edge_vertex_pairs();
    for(let p of pairs) {
      let weight = compute_edge_mean(p.edge) - p.vertex.position.y;
      pairs_weights.push({pair: p, weight: weight});
    }
    return pairs_weights;
  }

  function face_edge_weights() {
    let pairs_weights = [];
    let pairs = face_edge_pairs();
    for(let p of pairs) {
      let weight = compute_face_mean(p.face) - compute_edge_mean(p.edge);
      pairs_weights.push({pair: p, weight: weight});
    }
    return pairs_weights;
  }

    function custom_compare (a,b) {
      return a.weight - b.weight;
  }

  function sort_weights(pairs_weights) {
    let sorted = pairs_weights.sort(custom_compare);
    return sorted;
  }

  function compute_sorted_weights() {
    let fe_weights = face_edge_weights();
    let ev_weights = edge_vertex_weights();
    let weights = fe_weights.concat(ev_weights);
    let sorted_weights = sort_weights(weights);
    return sorted_weights;
  }

  function compute_gradient() {
    let pairs_weights = compute_sorted_weights();
    let simplices = get_simplices();

    let pairs = [];
    let gradient = [];
    let matched = [];

    //iterate through pairs sorted by weight
    for(let w of pairs_weights) {
      let p = w.pair;
      pairs.push(p);

      //test if edge or vertex in pair has already been matched
    if( p.type == 0 && (!matched.includes(p.vertex) && !matched.includes(p.edge) ) ) {
      let H = new DirectedHasse(simplices, pairs, gradient);
      let e = H.nodes.get(p.edge);
      let v = H.nodes.get(p.vertex);
      //H.insert(v,e);
      console.log(H.matrix);

      gradient.push(p);
      matched.push(p.vertex);
      matched.push(p.edge);

    } else if(p.type == 1 && (!matched.includes(p.edge) && !matched.includes(p.face)) ) {
      gradient.push(p);
      matched.push(p.edge);
      matched.push(p.face);
    }
  }

  return gradient;
  }


/*
  function paint_critical() {
    for(let f of S.allFaces()) {
      console.log(f.id);
      if( f.id < 10) {
        S.paint(f,{r:0.75, g:0.25, b:0.55} );
      }
    }
  }
*/

  //H.init_matrix(nodes.length);
  //H.insert(1,1);
  //console.log(H.matrix);
  let gradient = compute_gradient();
  return gradient;
}



// ********************************************************


    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    //
    // Tweak that allows us to change the coloring of the surface after
    // it has already been compiled with glBeginEnd.
    //

    paint(face, color) {
        glModColor(this.getName(), face.id, color);
    }



    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    //
    // SUPPORT for reading OBJ files, and normalizing its geometry
    //

    read(objText) {
        //
        // read(objText)
        //
        // Read in the contents of a .OBJ file and create the vertices, edges,
        // and triangular faces of the object it describes.
        //
        //  objText: string that has the text of the .OBJ file
        //

	    //
	    // The coordinate positions for object's base versus its height.
	    // e.g. [1,2,3] means the object's central axis is in Z direction
	    // and [3,1,2] means it is in the X direction.
	    //
	    let xyz = [1,2,3];

	    const lines = objText.split("\n");
	    //
	    // Process each line of the .OBJ file.
	    for (let line of lines) {

            const parts = line.split(" ");

            if (parts.length > 0) {

		        // Lines that start with v are a vertex spec.
		        //
		        // v x-coord y-coord z-coord
		        //
		        if (parts[0] == 'v') {
		            // Read a vertex description line.
                    const x = parseFloat(parts[xyz[0]]);
                    const y = parseFloat(parts[xyz[1]]);
                    const z = parseFloat(parts[xyz[2]]);
                    const P = new Point3d(x,y,z);
                    this.makeVertex(P);
		        }

		        // Lines that start with f are a face spec.
		        //
		        // f vi1 vi2 ... vik
                //
		        // These are vertex indices.
		        //
		        // Since we only handle triangles, we build a
		        // "fan of triangles", one triangle for each
		        // edge on the face, all sharing the corner vi1.
		        //
		        // .OBJ files allow each to be of the form
		        //
		        //  f vi1/vt1/vn1 vi2/...
		        //
		        // but we currently ignore vertex texture and
		        // vertex normal specifications for facets.
		        //
		        if (parts[0] == 'f') {
		            let viList = [];
		            for (let i = 1; i < parts.length; i++) {
			            //
			            // Ignores vertex textures/normals with split.
			            const vi = parseInt(parts[i].split('/')[0]) - 1;
			            //
			            // NOTE: subtracts one bc .OBJ starts at 1
			            viList.push(vi);
		            }
                    // Add a triangle for each edge of the face,
		            // excepting the first and last edges.
                    const vi1 = viList[0];
		            for (let i = 1; i < viList.length-1; i++) {
			            const vi2 = viList[i];
			            const vi3 = viList[i+1];
			            this.makeFace(vi1,vi2,vi3);
		            }
		        }
	        }
	    }
        this.recenter();
        this.regirth();
    }

    // regirth()
    //
    // Rescales the vertex points so that the distance of the furthest
    // point from the origin is length 1.0.
    //
    regirth() {
	    let radius2 = 0.0;
	    let bottom = Number.MAX_VALUE;
	    for (let V of this.allVertices()) {
	        const r2 = V.position.x * V.position.x
		          + V.position.y * V.position.y
                  + V.position.z * V.position.z;
	        if (r2 > radius2) {
		        radius2 = r2;
	        }
        }

	    const radius = Math.sqrt(radius2);
	    for (let V of this.allVertices()) {
	        V.position.x /= radius;
	        V.position.y /= radius;
	        V.position.z /= radius;
	    }
    }

    // recenter()
    //
    // Finds the bounding box of the surface and translates all the
    // vertex points so that their origin is the center of the bounding
    // box.
    //
    recenter() {
	    let maxDims = new Point3d(Number.MIN_VALUE,
				                  Number.MIN_VALUE,
				                  Number.MIN_VALUE);
	    let minDims = new Point3d(Number.MAX_VALUE,
				                  Number.MAX_VALUE,
				                  Number.MAX_VALUE);
	    for (let V of this.vertices.values()) {
	        maxDims = maxDims.max(V.position);
	        minDims = minDims.min(V.position);
	    }
	    const center = new Point3d((minDims.x + maxDims.x)/2.0,
				                   (minDims.y + maxDims.y)/2.0,
				                   (minDims.z + maxDims.z)/2.0);
	    for (let V of this.allVertices()) {
	        V.position = ORIGIN3D().plus(V.position.minus(center));
	    }
    }

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
    //
    // SUPPORT for rendering a surface
    //

    glCompile(harlequin = true) {
	    //
	    // Issues OPENGL instructions to render the triangular facets
	    // of the object, also computing the facet normals.
	    //
	    // It makes a series of glVertex3fv and glNormal3fv calls.
	    //
        glBegin(GL_TRIANGLES, this.getName(), harlequin);
	    for (let f of this.allFaces()) {
            if (harlequin) {
                glColor3f(0.25*Math.random()*0.25,
		                  0.25+Math.random()*0.25,
		                  0.25+Math.random()*0.25);
            }
	        f.getNormal().glNormal3fv();
            const ps = f.getPoints();
	        ps[0].glVertex3fv();
	        ps[1].glVertex3fv();
	        ps[2].glVertex3fv();
	    }
        glEnd();
    }

    glCompileMesh() {
	    //
	    // Issues OPENGL instructions to render the edges of the
	    // object so as to depict its wireframe mesh.
	    //
	    // It makes a series of glVertex3fv calls.
	    //
        glBegin(GL_LINES,this.getName()+"-mesh");
	    for (let e of this.allEdges()) {
	        const ps = e.getPoints();
	        ps[0].glVertex3fv();
	        ps[1].glVertex3fv();
	    }
        glEnd();
    }

    glRender() {
        glBeginEnd(this.getName());
    }

    glRenderMesh() {
        glBeginEnd(this.getName()+"-mesh");
    }
}
