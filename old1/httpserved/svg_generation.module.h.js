// Helper functions for SVG generation

let f_o_bbox_init = function(){
    return {
        min_x: Infinity,
        min_y: Infinity,
        max_x: -Infinity,
        max_y: -Infinity
    };
};

let f_update_bbox = function(o_bbox, n_x, n_y){
    o_bbox.min_x = Math.min(o_bbox.min_x, n_x);
    o_bbox.min_y = Math.min(o_bbox.min_y, n_y);
    o_bbox.max_x = Math.max(o_bbox.max_x, n_x);
    o_bbox.max_y = Math.max(o_bbox.max_y, n_y);
};

let f_o_point_from_arc = function(o_arc, n_ang_deg){
    let n_ang_rad = n_ang_deg * Math.PI / 180;
    return {
        x: o_arc.o_vec3_trn.n_x + o_arc.n_radius * Math.cos(n_ang_rad),
        y: o_arc.o_vec3_trn.n_y + o_arc.n_radius * Math.sin(n_ang_rad)
    };
};

let f_s_svg_points_ordered_mirrored = function(
    a_o_vec3
){

    let a_s_svg = [];


    let n_x_min = a_o_vec3.sort((a, b) => a.n_x - b.n_x)[0].n_x;
    let n_x_max = a_o_vec3.sort((a, b) => b.n_x - a.n_x)[0].n_x;
    let n_y_min = a_o_vec3.sort((a, b) => a.n_y - b.n_y)[0].n_y;
    let n_y_max = a_o_vec3.sort((a, b) => b.n_y - a.n_y)[0].n_y;
    
    let n_width = n_x_max - n_x_min;
    let n_height = n_y_max - n_y_min;
    let s_viewbox = (
        `${n_x_min - n_width * 0.1} ` +
        `${-n_y_max - n_height * 0.1} ` +
        `${n_width * 1.2} ` +
        `${n_height * 1.2}`
    );
    
    let n_marker_size = Math.min(n_width, n_height) * 0.05;
    let n_stroke = n_marker_size * 0.1;
    let n_font_size = n_marker_size * 1.2;
    let s_color__point = "rgba(255,0,0,0.8)";

    for(let n_idx = 0; n_idx < a_o_vec3.length; n_idx++){
        let o_vec3 = a_o_vec3[n_idx];
        let cx = o_vec3.n_x;
        let cy = -o_vec3.n_y;

        a_s_svg.push(
            `<circle cx="${cx}" cy="${cy}" r="${n_marker_size * 0.4}" ` +
            `stroke="rgba(0,0,0,0.5)" stroke-width="${n_stroke * 0.5}" fill="${s_color__point}" />`
        );
        a_s_svg.push(
            `<text x="${cx + n_marker_size * 0.5}" y="${cy - n_marker_size * 0.3}" ` +
            `font-size="${n_font_size}" font-family="sans-serif" font-weight="bold" ` +
            `fill="rgba(0,0,0,0.8)" stroke="rgba(255,255,255,0.6)" stroke-width="${n_font_size*0.05}">${n_idx}</text>`
        );
    }

    return (
        `<svg xmlns="http://www.w3.org/2000/svg" ` +
        `width="100%" height="100%" ` +
        `viewBox="${s_viewbox}" stroke-linecap="round" preserveAspectRatio="xMidYMid meet">` +
        a_s_svg.join("\n") +
        `</svg>`
    );


}


let f_s_svg_from_a_a_o_entity_group = function(
    a_a_o_entity_group
){
    // visualize the entities
    // each group has a different color.
    // each entity has the index of it as a number next to it
    // so that the order can visually be checked

    if(!a_a_o_entity_group || a_a_o_entity_group.length === 0){
        return '<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%"></svg>';
    }

    // color palette for groups (distinct hues)
    let a_s_color__group = [
        "rgba(220, 60, 60, 0.8)",    // red
        "rgba(60, 140, 220, 0.8)",   // blue
        "rgba(60, 180, 60, 0.8)",    // green
        "rgba(200, 140, 40, 0.8)",   // orange
        "rgba(160, 60, 200, 0.8)",   // purple
        "rgba(40, 180, 180, 0.8)",   // cyan
        "rgba(200, 60, 140, 0.8)",   // pink
        "rgba(140, 140, 40, 0.8)"    // olive
    ];

    let a_s_svg = [];
    let o_bbox = f_o_bbox_init();

    // first pass: calculate bounding box
    for(let a_o_entity_group of a_a_o_entity_group){
        for(let o_ent of a_o_entity_group){
            if(o_ent.s_type === "LINE"){
                f_update_bbox(o_bbox, o_ent.o_vec3_trn_start.n_x, o_ent.o_vec3_trn_start.n_y);
                f_update_bbox(o_bbox, o_ent.o_vec3_trn_end.n_x, o_ent.o_vec3_trn_end.n_y);
            } else if(o_ent.s_type === "ARC"){
                let o_p_start = f_o_point_from_arc(o_ent, o_ent.n_ang_deg_start);
                let o_p_end = f_o_point_from_arc(o_ent, o_ent.n_ang_deg_end);
                f_update_bbox(o_bbox, o_p_start.x, o_p_start.y);
                f_update_bbox(o_bbox, o_p_end.x, o_p_end.y);
            }
        }
    }

    // calculate sizes based on bbox
    let n_scl_x = o_bbox.max_x - o_bbox.min_x;
    let n_scl_y = o_bbox.max_y - o_bbox.min_y;
    let n_bbox_size = Math.max(n_scl_x, n_scl_y) || 100;
    let n_unit = n_bbox_size * 0.01;
    let n_stroke = n_unit * 2;
    let n_font_size = n_unit * 8;
    let n_marker_radius = n_unit * 3;

    // second pass: draw entities with group colors and indices
    for(let n_idx_group = 0; n_idx_group < a_a_o_entity_group.length; n_idx_group++){
        let a_o_entity_group = a_a_o_entity_group[n_idx_group];
        let s_color = a_s_color__group[n_idx_group % a_s_color__group.length];

        for(let n_idx_entity = 0; n_idx_entity < a_o_entity_group.length; n_idx_entity++){
            let o_ent = a_o_entity_group[n_idx_entity];

            // draw the entity
            if(o_ent.s_type === "LINE"){
                let n_x1 = o_ent.o_vec3_trn_start.n_x;
                let n_y1 = o_ent.o_vec3_trn_start.n_y;
                let n_x2 = o_ent.o_vec3_trn_end.n_x;
                let n_y2 = o_ent.o_vec3_trn_end.n_y;

                a_s_svg.push(
                    `<line x1="${n_x1}" y1="${-n_y1}" x2="${n_x2}" y2="${-n_y2}" ` +
                    `stroke="${s_color}" stroke-width="${n_stroke}" fill="none" />`
                );

                // index label at midpoint
                let n_mid_x = (n_x1 + n_x2) / 2;
                let n_mid_y = -(n_y1 + n_y2) / 2;
                a_s_svg.push(
                    `<circle cx="${n_mid_x}" cy="${n_mid_y}" r="${n_marker_radius}" ` +
                    `fill="white" stroke="${s_color}" stroke-width="${n_stroke * 0.5}" />`
                );
                a_s_svg.push(
                    `<text x="${n_mid_x}" y="${n_mid_y + n_font_size * 0.35}" ` +
                    `font-size="${n_font_size}" font-family="sans-serif" font-weight="bold" ` +
                    `text-anchor="middle" fill="${s_color}">${n_idx_entity}</text>`
                );
            }
            else if(o_ent.s_type === "ARC"){
                let o_p_start = f_o_point_from_arc(o_ent, o_ent.n_ang_deg_start);
                let o_p_end = f_o_point_from_arc(o_ent, o_ent.n_ang_deg_end);

                let n_deg_sweep = o_ent.n_ang_deg_end - o_ent.n_ang_deg_start;
                if(n_deg_sweep < 0){ n_deg_sweep += 360; }

                let n_flag_large_arc = n_deg_sweep > 180 ? 1 : 0;
                let n_flag_sweep = 0;

                a_s_svg.push(
                    `<path d="M ${o_p_start.x} ${-o_p_start.y} ` +
                    `A ${o_ent.n_radius} ${o_ent.n_radius} 0 ` +
                    `${n_flag_large_arc} ${n_flag_sweep} ` +
                    `${o_p_end.x} ${-o_p_end.y}" ` +
                    `stroke="${s_color}" stroke-width="${n_stroke}" fill="none" />`
                );

                // index label at arc midpoint
                let n_ang_mid = (o_ent.n_ang_deg_start + o_ent.n_ang_deg_end) / 2;
                let o_p_mid = f_o_point_from_arc(o_ent, n_ang_mid);
                a_s_svg.push(
                    `<circle cx="${o_p_mid.x}" cy="${-o_p_mid.y}" r="${n_marker_radius}" ` +
                    `fill="white" stroke="${s_color}" stroke-width="${n_stroke * 0.5}" />`
                );
                a_s_svg.push(
                    `<text x="${o_p_mid.x}" y="${-o_p_mid.y + n_font_size * 0.35}" ` +
                    `font-size="${n_font_size}" font-family="sans-serif" font-weight="bold" ` +
                    `text-anchor="middle" fill="${s_color}">${n_idx_entity}</text>`
                );
            }
        }
    }

    // draw legend for groups
    let n_legend_x = o_bbox.min_x - n_bbox_size * 0.15;
    let n_legend_y = -o_bbox.max_y;
    let n_legend_spacing = n_font_size * 1.5;

    for(let n_idx_group = 0; n_idx_group < a_a_o_entity_group.length; n_idx_group++){
        let s_color = a_s_color__group[n_idx_group % a_s_color__group.length];
        let n_y = n_legend_y + n_idx_group * n_legend_spacing;

        a_s_svg.push(
            `<line x1="${n_legend_x}" y1="${n_y}" x2="${n_legend_x + n_font_size}" y2="${n_y}" ` +
            `stroke="${s_color}" stroke-width="${n_stroke}" />`
        );
        a_s_svg.push(
            `<text x="${n_legend_x + n_font_size * 1.3}" y="${n_y + n_font_size * 0.35}" ` +
            `font-size="${n_font_size}" font-family="sans-serif" ` +
            `fill="rgba(0,0,0,0.8)">Group ${n_idx_group}</text>`
        );
    }

    // viewBox
    let n_pad = n_bbox_size * 0.1;
    let n_viewbox_x = o_bbox.min_x - n_pad - n_bbox_size * 0.2;
    let n_viewbox_y = -(o_bbox.max_y + n_pad);
    let n_viewbox_scl_x = n_scl_x + n_pad * 2 + n_bbox_size * 0.2;
    let n_viewbox_scl_y = n_scl_y + n_pad * 2;

    let s_viewbox = `${n_viewbox_x} ${n_viewbox_y} ${n_viewbox_scl_x} ${n_viewbox_scl_y}`;

    return (
        `<svg xmlns="http://www.w3.org/2000/svg" ` +
        `width="100%" height="100%" ` +
        `viewBox="${s_viewbox}" stroke-linecap="round" preserveAspectRatio="xMidYMid meet">` +
        a_s_svg.join("\n") +
        `</svg>`
    );
}
let f_s_svg_from_a_a_o_vec3_trn_ordered = function(
    a_a_o_vec3_trn_ordered
){
    // each group of points is visualized with a different color
    // each point has the index of it as a number next to it
    // points are connected with lines to show the path

    if(!a_a_o_vec3_trn_ordered || a_a_o_vec3_trn_ordered.length === 0){
        return '<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%"></svg>';
    }

    // color palette for groups
    let a_s_color__group = [
        "rgba(220, 60, 60, 0.8)",    // red
        "rgba(60, 140, 220, 0.8)",   // blue
        "rgba(60, 180, 60, 0.8)",    // green
        "rgba(200, 140, 40, 0.8)",   // orange
        "rgba(160, 60, 200, 0.8)",   // purple
        "rgba(40, 180, 180, 0.8)",   // cyan
        "rgba(200, 60, 140, 0.8)",   // pink
        "rgba(140, 140, 40, 0.8)"    // olive
    ];

    let a_s_svg = [];
    let o_bbox = f_o_bbox_init();

    // first pass: calculate bounding box
    for(let a_o_vec3_trn of a_a_o_vec3_trn_ordered){
        for(let o_vec3 of a_o_vec3_trn){
            f_update_bbox(o_bbox, o_vec3.n_x, o_vec3.n_y);
        }
    }

    // calculate sizes based on bbox
    let n_scl_x = o_bbox.max_x - o_bbox.min_x;
    let n_scl_y = o_bbox.max_y - o_bbox.min_y;
    let n_bbox_size = Math.max(n_scl_x, n_scl_y) || 100;
    let n_unit = n_bbox_size * 0.01;
    let n_stroke = n_unit * 1.5;
    let n_stroke__path = n_unit * 1;
    let n_font_size = n_unit * 4;
    let n_marker_radius = n_unit * 2;

    // second pass: draw paths and points
    for(let n_idx_group = 0; n_idx_group < a_a_o_vec3_trn_ordered.length; n_idx_group++){
        let a_o_vec3_trn = a_a_o_vec3_trn_ordered[n_idx_group];
        let s_color = a_s_color__group[n_idx_group % a_s_color__group.length];

        if(a_o_vec3_trn.length === 0) continue;

        // draw path connecting points
        if(a_o_vec3_trn.length > 1){
            let s_path_d = `M ${a_o_vec3_trn[0].n_x} ${-a_o_vec3_trn[0].n_y}`;
            for(let n_idx = 1; n_idx < a_o_vec3_trn.length; n_idx++){
                s_path_d += ` L ${a_o_vec3_trn[n_idx].n_x} ${-a_o_vec3_trn[n_idx].n_y}`;
            }
            a_s_svg.push(
                `<path d="${s_path_d}" stroke="${s_color}" stroke-width="${n_stroke__path}" fill="none" opacity="0.5" />`
            );
        }

        // draw points with indices
        for(let n_idx_point = 0; n_idx_point < a_o_vec3_trn.length; n_idx_point++){
            let o_vec3 = a_o_vec3_trn[n_idx_point];
            let n_cx = o_vec3.n_x;
            let n_cy = -o_vec3.n_y;

            // highlight first and last points
            let b_endpoint = (n_idx_point === 0 || n_idx_point === a_o_vec3_trn.length - 1);
            let n_radius = b_endpoint ? n_marker_radius * 1.5 : n_marker_radius;

            a_s_svg.push(
                `<circle cx="${n_cx}" cy="${n_cy}" r="${n_radius}" ` +
                `fill="${b_endpoint ? s_color : 'white'}" stroke="${s_color}" stroke-width="${n_stroke * 0.5}" />`
            );

            // show index for every Nth point to avoid clutter (or all if few points)
            let n_step = a_o_vec3_trn.length > 20 ? Math.ceil(a_o_vec3_trn.length / 20) : 1;
            let b_show_label = (n_idx_point % n_step === 0) || b_endpoint;
            // 
            b_show_label = true;

            if(b_show_label){
                a_s_svg.push(
                    `<text x="${n_cx + n_marker_radius * 1.2}" y="${n_cy - n_marker_radius * 0.5}" ` +
                    `font-size="${n_font_size}" font-family="sans-serif" font-weight="${b_endpoint ? 'bold' : 'normal'}" ` +
                    `fill="${s_color}">${n_idx_point}</text>`
                );
            }
        }
    }

    // draw legend
    let n_legend_x = o_bbox.min_x - n_bbox_size * 0.15;
    let n_legend_y = -o_bbox.max_y;
    let n_legend_spacing = n_font_size * 2;

    for(let n_idx_group = 0; n_idx_group < a_a_o_vec3_trn_ordered.length; n_idx_group++){
        let s_color = a_s_color__group[n_idx_group % a_s_color__group.length];
        let n_cnt_point = a_a_o_vec3_trn_ordered[n_idx_group].length;
        let n_y = n_legend_y + n_idx_group * n_legend_spacing;

        a_s_svg.push(
            `<circle cx="${n_legend_x + n_font_size * 0.5}" cy="${n_y}" r="${n_marker_radius}" ` +
            `fill="${s_color}" />`
        );
        a_s_svg.push(
            `<text x="${n_legend_x + n_font_size * 1.5}" y="${n_y + n_font_size * 0.35}" ` +
            `font-size="${n_font_size}" font-family="sans-serif" ` +
            `fill="rgba(0,0,0,0.8)">Group ${n_idx_group} (${n_cnt_point} pts)</text>`
        );
    }

    // viewBox
    let n_pad = n_bbox_size * 0.1;
    let n_viewbox_x = o_bbox.min_x - n_pad - n_bbox_size * 0.25;
    let n_viewbox_y = -(o_bbox.max_y + n_pad);
    let n_viewbox_scl_x = n_scl_x + n_pad * 2 + n_bbox_size * 0.25;
    let n_viewbox_scl_y = n_scl_y + n_pad * 2;

    let s_viewbox = `${n_viewbox_x} ${n_viewbox_y} ${n_viewbox_scl_x} ${n_viewbox_scl_y}`;

    return (
        `<svg xmlns="http://www.w3.org/2000/svg" ` +
        `width="100%" height="100%" ` +
        `viewBox="${s_viewbox}" stroke-linecap="round" preserveAspectRatio="xMidYMid meet">` +
        a_s_svg.join("\n") +
        `</svg>`
    );
}

export {
    f_s_svg_points_ordered_mirrored,
    f_s_svg_from_a_a_o_entity_group,
    f_s_svg_from_a_a_o_vec3_trn_ordered
}