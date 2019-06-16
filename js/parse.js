function split_into_words(line) {
    return line.split(/(\s+)/).filter(e => e.trim().length > 0);
}

function parse_cube_file(text) {
    var lines = text.split("\n");

    var words = split_into_words(lines[2]);
    var num_centers = parseInt(words[0]);

    // https://h5cube-spec.readthedocs.io/en/latest/cubeformat.html#cubeformat-dset-ids
    var dset_ids_present = false;
    if (num_centers < 0) {
        dset_ids_present = true;
        num_centers = -num_centers;
    }

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

    var num_lines_before_values = 5 + num_centers + 1;

    // we take care of these
    // https://h5cube-spec.readthedocs.io/en/latest/cubeformat.html#cubeformat-dset-ids
    // but for the moment they are discarded and not used
    if (dset_ids_present) {
        words = split_into_words(lines[num_lines_before_values]);
        var num_identifiers = parseInt(words[0]);
        var m = words.length - 1;
        num_lines_before_values += 1;
        while (m < num_identifiers) {
            words = split_into_words(lines[num_lines_before_values]);
            m += words.length;
            num_lines_before_values += 1;
        }
    }

    var il = 0;
    var values = [];
    for (var line of lines) {
        il += 1;
        if (il > num_lines_before_values) {
            for (var v of split_into_words(line)) {
                values.push(parseFloat(v));
            }
        }
    }

    var error = "";
    if (values.length !== (num_points_x * num_points_y * num_points_z)) {
        error = "Are you sure this cube file is not broken?";
    }

    var data = {
        "error": error,
        "centers": centers,
        "origin": [origin_x, origin_y, origin_z],
        "step": [step_x, step_y, step_z],
        "num_points": [num_points_x, num_points_y, num_points_z],
        "values": values,
    };

    return data;
}
