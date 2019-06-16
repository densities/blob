[![License](https://img.shields.io/badge/license-%20AGPL-blue.svg)](LICENSE)

# blob: plot densities directly in your browser

![the blob](img/blob.jpg)


## This is a mashup of great libraries and examples

- https://threejs.org for 3D rendering
- [threex](https://github.com/jeromeetienne/threex): Game Extensions for three.js
- Marching cubes algorithm based on https://stemkoski.github.io/Three.js/
- https://vuejs.org for the user interface
- [Vue Color](https://github.com/xiaokaike/vue-color)
- [Bootstrap](https://getbootstrap.com) for CSS


## How to try it out

- Download an [example cube file](https://github.com/densities/blob/tree/gh-pages/example) (or create your own).
- Visit https://densities.github.io/blob/ and try it out.


## Status of this project

- At this point only proof-of-concept.
- Function interfaces are not stable and will change.
- Right now only understands Gaussian cube file format but later we can add support for other formats.


## How you can contribute

Please [suggest ideas](https://github.com/densities/blob/issues) and
[contribute patches](https://github.com/densities/blob/pulls).

For non-trivial changes please first [open an
issue](https://github.com/densities/blob/issues) and describe what you have in
mind and collect feedback and program once you got a bit of feedback - this
helps to sharpen the goal and to avoid surprises.


## How to cite this project

[We will add this information soon, until then please refer to this URL.]


## Implementation notes

For the CUBE file format we follow [this specification](https://h5cube-spec.readthedocs.io/en/latest/cubeformat.html).

The starting isovalue is the mean of absolute values (better definition is welcome).
