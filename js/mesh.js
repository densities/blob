function array_min(a) {
    r = Number.MAX_VALUE;
    for (const element of a) {
        r = (element < r ? element : r);
    }
    return r;
}


function array_max(a) {
    r = -Number.MAX_VALUE;
    for (const element of a) {
        r = (element > r ? element : r);
    }
    return r;
}


// marching cubes algorithm
// this function is based on the example
// https://stemkoski.github.io/Three.js/Marching-Cubes.html (c) Lee Stemkoski
function create_mesh(data, isovalue, color, opacity) {

    isovalue = parseFloat(isovalue);

    // number of cubes along a side
    var num_points_x = data["num_points"][0];
    var num_points_y = data["num_points"][1];
    var num_points_z = data["num_points"][2];
    var num_points_yz = num_points_y * num_points_z;

    var origin_x = data["origin"][0];
    var origin_y = data["origin"][1];
    var origin_z = data["origin"][2];

    var step_x = data["step"][0];
    var step_y = data["step"][1];
    var step_z = data["step"][2];

    var points = [];
    var x = origin_x;
    for (var ix = 0; ix < num_points_x; ix++) {
        x += step_x;
        var y = origin_y;
        for (var iy = 0; iy < num_points_y; iy++) {
            y += step_y;
            var z = origin_z;
            for (var iz = 0; iz < num_points_z; iz++) {
                z += step_z;
                points.push(new THREE.Vector3(x, y, z));
            }
        }
    }

    // Vertices may occur along edges of cube, when the values at the edge's endpoints
    //   straddle the isolevel value.
    // Actual position along edge weighted according to function values.
    var vlist = new Array(12);

    var geometry = new THREE.Geometry();
    var vertexIndex = 0;

    var vs = data["values"];
    for (var z = 0; z < num_points_z - 1; z++)
        for (var y = 0; y < num_points_y - 1; y++)
            for (var x = 0; x < num_points_x - 1; x++) {

                // index of base point, and also adjacent points on cube
                var p = z + num_points_z * y + num_points_yz * x;
                var pz = p + 1;
                var py = p + num_points_z;
                var pyz = py + 1;
                var px = p + num_points_yz;
                var pxz = pz + num_points_yz;
                var pxy = py + num_points_yz;
                var pxyz = pyz + num_points_yz;

                // store scalar values corresponding to vertices
                var values = [
                    vs[p],
                    vs[px],
                    vs[py],
                    vs[pxy],
                    vs[pz],
                    vs[pxz],
                    vs[pyz],
                    vs[pxyz],
                ]

                // if all corners have smaller value than isovalue, skip this voxel
                //    if (array_max(values) < isovalue) continue;

                // if all corners have larger value than isovalue, skip this voxel
                //    if (array_min(values) > isovalue) continue;

                // place a "1" in bit positions corresponding to vertices whose
                // isovalue is less than given constant.
                var cubeindex = 0;
                if (values[0] < isovalue) cubeindex |= 1;
                if (values[1] < isovalue) cubeindex |= 2;
                if (values[2] < isovalue) cubeindex |= 8;
                if (values[3] < isovalue) cubeindex |= 4;
                if (values[4] < isovalue) cubeindex |= 16;
                if (values[5] < isovalue) cubeindex |= 32;
                if (values[6] < isovalue) cubeindex |= 128;
                if (values[7] < isovalue) cubeindex |= 64;

                // bits = 12 bit number, indicates which edges are crossed by the isosurface
                var bits = THREE.edgeTable[cubeindex];

                // if none are crossed, proceed to next iteration
                if (bits === 0) continue;

                // check which edges are crossed, and estimate the point location
                //    using a weighted average of scalar values at edge endpoints.
                // store the vertex in an array for use later.
                var mu = 0.5;

                // bottom of the cube
                if (bits & 1) {
                    mu = (isovalue - values[0]) / (values[1] - values[0]);
                    vlist[0] = points[p].clone().lerp(points[px], mu);
                }
                if (bits & 2) {
                    mu = (isovalue - values[1]) / (values[3] - values[1]);
                    vlist[1] = points[px].clone().lerp(points[pxy], mu);
                }
                if (bits & 4) {
                    mu = (isovalue - values[2]) / (values[3] - values[2]);
                    vlist[2] = points[py].clone().lerp(points[pxy], mu);
                }
                if (bits & 8) {
                    mu = (isovalue - values[0]) / (values[2] - values[0]);
                    vlist[3] = points[p].clone().lerp(points[py], mu);
                }

                // top of the cube
                if (bits & 16) {
                    mu = (isovalue - values[4]) / (values[5] - values[4]);
                    vlist[4] = points[pz].clone().lerp(points[pxz], mu);
                }
                if (bits & 32) {
                    mu = (isovalue - values[5]) / (values[7] - values[5]);
                    vlist[5] = points[pxz].clone().lerp(points[pxyz], mu);
                }
                if (bits & 64) {
                    mu = (isovalue - values[6]) / (values[7] - values[6]);
                    vlist[6] = points[pyz].clone().lerp(points[pxyz], mu);
                }
                if (bits & 128) {
                    mu = (isovalue - values[4]) / (values[6] - values[4]);
                    vlist[7] = points[pz].clone().lerp(points[pyz], mu);
                }

                // vertical lines of the cube
                if (bits & 256) {
                    mu = (isovalue - values[0]) / (values[4] - values[0]);
                    vlist[8] = points[p].clone().lerp(points[pz], mu);
                }
                if (bits & 512) {
                    mu = (isovalue - values[1]) / (values[5] - values[1]);
                    vlist[9] = points[px].clone().lerp(points[pxz], mu);
                }
                if (bits & 1024) {
                    mu = (isovalue - values[3]) / (values[7] - values[3]);
                    vlist[10] = points[pxy].clone().lerp(points[pxyz], mu);
                }
                if (bits & 2048) {
                    mu = (isovalue - values[2]) / (values[6] - values[2]);
                    vlist[11] = points[py].clone().lerp(points[pyz], mu);
                }

                // construct triangles -- get correct vertices from triTable.
                var i = 0;
                cubeindex <<= 4; // multiply by 16...
                // "Re-purpose cubeindex into an offset into triTable."
                //  since each row really isn't a row.

                // the while loop should run at most 5 times,
                //   since the 16th entry in each row is a -1.
                while (THREE.triTable[cubeindex + i] != -1) {
                    var index1 = THREE.triTable[cubeindex + i];
                    var index2 = THREE.triTable[cubeindex + i + 1];
                    var index3 = THREE.triTable[cubeindex + i + 2];

                    geometry.vertices.push(vlist[index1].clone());
                    geometry.vertices.push(vlist[index2].clone());
                    geometry.vertices.push(vlist[index3].clone());
                    var face = new THREE.Face3(vertexIndex, vertexIndex + 1, vertexIndex + 2);
                    geometry.faces.push(face);

                    geometry.faceVertexUvs[0].push([new THREE.Vector2(0, 0), new THREE.Vector2(0, 1), new THREE.Vector2(1, 1)]);

                    vertexIndex += 3;
                    i += 3;
                }
            }

    geometry.computeFaceNormals();
    geometry.computeVertexNormals();

    var color_hex = parseInt(color, 16);

    var colorMaterial = new THREE.MeshLambertMaterial({
        color: color_hex,
        side: THREE.DoubleSide,
        opacity: opacity,
        transparent: true
    });

    var mesh = new THREE.Mesh(geometry, colorMaterial);
    return mesh;
}