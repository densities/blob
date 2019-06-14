'use strict';

const average = array => array.reduce((a, b) => a + b, 0) / array.length

// move camera according to min/max x, y, and z coordinates of points
function adjust_camera_position(xs, ys, zs, camera) {
    var x_max = -Number.MAX_VALUE;
    var y_max = -Number.MAX_VALUE;
    var z_max = -Number.MAX_VALUE;
    for (var i = 0; i < xs.length; i++) {
        x_max = Math.max(x_max, xs[i]);
        y_max = Math.max(y_max, ys[i]);
        z_max = Math.max(z_max, zs[i]);
    }
    camera.position.set(1.5 * x_max, 1.5 * y_max, 1.5 * z_max);
}

var app = new Vue({
    el: '#app',
    data: {
        isovalue: "0.15",
        color: 'ff00ff',
        opacity: 0.6,
        axes: new THREE.AxesHelper(100),
        show_axes: true,
        centers: null,
        show_centers: true,
        data: null,
        mesh: null,
        scene: null,
        camera: null,
        renderer: null,
        controls: null,
        message_info: "Please load a cube file before we can begin.",
        message_error: "",
        data_is_loaded: false,
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
            this.debounced_update_isosurface();
        },
        opacity: function(val) {
            if (val > 0.0) {
                var opacity = Math.min(val, 1.0);
                this.mesh.material.opacity = opacity;
            }
        },
        color: function(val) {
            // at this moment we do not check whether this is a valid hex
            // we only check the length
            if (val.length == 6) {
                var color_hex = parseInt(val, 16);
                this.mesh.material.color.setHex(color_hex);
            }
        },
    },
    methods: {
        update_isosurface() {
            this.scene.remove(this.mesh);
            var start = new Date().getTime();
            this.mesh = create_mesh(this.data, this.isovalue, this.color, this.opacity);
            var end = new Date().getTime();
            var time = end - start;
            console.log('meshing time: ' + time);
            this.scene.add(this.mesh);
        },
        load_text_file(ev) {
            this.message_info = "";
            this.message_error = "";
            this.data_is_loaded = false;

            var vm = this;
            const file = ev.target.files[0];
            const reader = new FileReader();

            reader.onload = function(e) {
                vm.data = parse_cube_file(e.target.result);
                if (vm.data["error"].length > 0) {
                    vm.message_error = vm.data["error"];
                } else {
                    adjust_camera_position(vm.data["xs"], vm.data["ys"], vm.data["zs"], vm.camera);
                    vm.isovalue = average(vm.data["vs"]).toFixed(5);

                    var geometry = new THREE.SphereGeometry(0.05, 32, 32);
                    var material = new THREE.MeshBasicMaterial({
                        color: 0xffff00
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

            // light position and color
            var light = new THREE.PointLight(0xffffff);
            light.position.set(0, 10, 0);
            this.scene.add(light);

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
        this.debounced_update_isosurface = _.debounce(this.update_isosurface, 200);
    },
})
