function split_into_words(line) {
    return line.split(/(\s+)/).filter(e => e.trim().length > 0);
}

function parse_cube_file(text) {
    var lines = text.split("\n");

    var words = split_into_words(lines[2]);
    var num_centers = parseInt(words[0]);

    var origin_x = parseFloat(words[1]);
    var origin_y = parseFloat(words[2]);
    var origin_z = parseFloat(words[3]);

    words = split_into_words(lines[3]);
    var num_points_x = parseInt(words[0]);
    var step_x = parseFloat(words[1]);
    words = split_into_words(lines[4]);
    var num_points_y = parseInt(words[0]);
    var step_y = parseFloat(words[2]);
    words = split_into_words(lines[5]);
    var num_points_z = parseInt(words[0]);
    var step_z = parseFloat(words[3]);

    var centers = [];
    for (var i = 0; i < num_centers; i++) {
        words = split_into_words(lines[5 + i + 1]);
        var center_x = parseFloat(words[2]);
        var center_y = parseFloat(words[3]);
        var center_z = parseFloat(words[4]);
        centers.push([center_x, center_y, center_z]);
    }

    var xs = [];
    var ys = [];
    var zs = [];

    var x = origin_x;
    for (var ix = 0; ix < num_points_x; ix++) {
        x += step_x;
        var y = origin_y;
        for (var iy = 0; iy < num_points_y; iy++) {
            y += step_y;
            var z = origin_z;
            for (var iz = 0; iz < num_points_z; iz++) {
                z += step_z;
                xs.push(x);
                ys.push(y);
                zs.push(z);
            }
        }
    }

    var il = 0;
    var vs = [];
    for (var line of text.split("\n")) {
        il += 1;
        if (il > 5 + num_centers + 1) {
            for (var v of split_into_words(line)) {
                vs.push(parseFloat(v));
            }
        }
    }

    var error = "";
    if (vs.length !== (num_points_x * num_points_y * num_points_z)) {
        error = "Are you sure this cube file is not broken?";
    }

    var data = {
        "error": error,
        "num_centers": num_centers,
        "centers": centers,
        "num_points_x": num_points_x,
        "num_points_y": num_points_y,
        "num_points_z": num_points_z,
        "xs": xs,
        "ys": ys,
        "zs": zs,
        "vs": vs,
    };

    return data;
}