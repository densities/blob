'use strict';

function starting_isovalue(values) {
    var result = 0.0;
    for (var value of values) {
        result += Math.abs(value);
    }
    result /= values.length;
    return result.toFixed(5);
}

// move camera according to the cube extent
function adjust_camera_position(origin, step, num_points, camera) {
    var camera_position = [-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE];
    for (var i = 0; i < 3; i++) {
        camera_position[i] = Math.max(camera_position[i], Math.abs(origin[i]));
        camera_position[i] = Math.max(camera_position[i], Math.abs(origin[i] + (num_points[i] - 1) * step[i]));
    }
    camera.position.set(1.5 * camera_position[0], 1.5 * camera_position[1], 1.5 * camera_position[2]);
}

var Chrome = window.VueColor.Chrome;

var app = new Vue({
    el: '#app',
    data: {
        isovalue: 0.15,
        colors: [{
            "hex": "#ff0000",
            "source": "hex",
            "a": 0.6
        }, {
            "hex": "#0000ff",
            "source": "hex",
            "a": 0.6
        }],
        color_picker_is_open: [false, false],
        meshes: [null, null],
        show_meshes: [false, false],
        axes: new THREE.AxesHelper(100),
        show_axes: true,
        centers: null,
        show_centers: true,
        data: null,
        scene: null,
        camera: null,
        renderer: null,
        controls: null,
        message_info: "Please load a cube file before we can begin.",
        message_error: "",
        data_is_loaded: false,
    },
    components: {
        'chrome-picker': Chrome
    },
    watch: {
        show_axes: function(val) {
            if (this.show_axes) {
                this.scene.add(this.axes);
            } else {
                this.scene.remove(this.axes);
            }
        },
        show_centers: function(val) {
            if (this.show_centers) {
                this.scene.add(this.centers);
            } else {
                this.scene.remove(this.centers);
            }
        },
        isovalue: function(val) {
            this.debounced_update_isosurfaces();
        },
        colors: function(val) {
            for (var i = 0; i < 2; i++) {
                if (this.show_meshes[i]) {
                    this.meshes[i].material.color.setHex(parseInt(val[i].hex.slice(1), 16));
                    this.meshes[i].material.opacity = val[i].a;
                }
            }
        },
    },
    methods: {
        toggle_color_picker: function(i) {
            Vue.set(this.color_picker_is_open, i, !this.color_picker_is_open[i])
            this.colors[i].source = 'hex';
        },
        update_isosurfaces() {
            console.log('show meshes: ' + this.show_meshes);
            let isovalues = [this.isovalue, -this.isovalue];
            for (var i = 0; i < 2; i++) {
                if (this.meshes[i] !== null) {
                    this.scene.remove(this.meshes[i]);
                }
                if (this.show_meshes[i]) {
                    var start = new Date().getTime();
                    Vue.set(this.meshes, i, create_mesh(this.data, isovalues[i], this.colors[i].hex.slice(1), this.colors[i].a));
                    var end = new Date().getTime();
                    var time = end - start;
                    console.log('spent ' + time + ' ms on mesh ' + i);
                    this.scene.add(this.meshes[i]);
                }
            }
        },
        load_text_file(ev) {
            this.message_info = "";
            this.message_error = "";
            this.data_is_loaded = false;

            var vm = this;
            const file = ev.target.files[0];
            const reader = new FileReader();

            // if we load a new file, make sure we remove the old molecule
            if (this.centers !== null) {
                this.scene.remove(this.centers);
                this.centers = null;
            }

            reader.onload = function(e) {
                vm.data = parse_cube_file(e.target.result);
                if (vm.data["error"].length > 0) {
                    vm.message_error = vm.data["error"];
                } else {
                    adjust_camera_position(vm.data["origin"], vm.data["step"], vm.data["num_points"], vm.camera);
                    vm.isovalue = starting_isovalue(vm.data["values"]);

                    let positive_values = vm.data["values"].filter(val => {
                        return val > Number.MIN_VALUE;
                    });
                    Vue.set(vm.show_meshes, 0, (positive_values.length > 0));

                    let negative_values = vm.data["values"].filter(val => {
                        return -val > Number.MIN_VALUE;
                    });
                    Vue.set(vm.show_meshes, 1, (negative_values.length > 0));

                    var geometry = new THREE.SphereGeometry(0.10, 32, 32);
                    var material = new THREE.MeshBasicMaterial({
                        color: 0x000000
                    });

                    vm.centers = new THREE.Group();
                    for (var center of vm.data["centers"]) {
                        var sphere = new THREE.Mesh(geometry, material);
                        sphere.position.set(center[0], center[1], center[2]);
                        vm.centers.add(sphere);
                    }
                    vm.show_centers = true;
                    vm.scene.add(vm.centers);
                    vm.data_is_loaded = true;
                }
            };

            reader.onerror = function(e) {
                this.message_error = "File could not be read! Code " + e.target.error.code;
            };

            reader.readAsText(file);
        },
        init() {
            // scene and camera setup
            this.scene = new THREE.Scene();
            let view_angle = 45;
            let aspect = window.innerWidth / window.innerHeight;
            let near = 0.1;
            let far = 20000;
            this.camera = new THREE.PerspectiveCamera(view_angle, aspect, near, far);
            this.scene.add(this.camera);
            this.camera.position.set(20.0, 20.0, 20.0);
            this.camera.lookAt(this.scene.position);

            // light position and color
            var light = new THREE.PointLight(0xffffff);
            light.position.set(0.0, 0.0, 0.0);
            this.camera.add(light);

            // set up renderer
            this.renderer = new THREE.WebGLRenderer();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.renderer.setClearColor(0xffffff, 1);
            document.body.appendChild(this.renderer.domElement);

            // enable full-screen with x key
            THREEx.WindowResize(this.renderer, this.camera);
            THREEx.FullScreen.bindKey({
                charCode: 'x'.charCodeAt(0)
            });

            // orbit controls: zoom and pan
            this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);

            // axes
            this.scene.add(this.axes);
        },
        animate() {
            requestAnimationFrame(this.animate);
            this.renderer.render(this.scene, this.camera);
            this.controls.update();
        },
    },
    created: function() {
        this.init();
        this.animate();

        // delay updating by 200 ms to prevent it from computing "while typing"
        this.debounced_update_isosurfaces = _.debounce(this.update_isosurfaces, 200);
    },
})
