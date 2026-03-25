// Copyright (C) [2026] [Jonas Immanuel Frey] - Licensed under GPLv2. See LICENSE file for details.

import { o_state, f_send_wsmsg_with_response, o_wsmsg__syncdata } from './index.js';
import { f_o_html_from_o_js } from "./lib/handyhelpers.js";
import {
    f_o_wsmsg,
    o_wsmsg__upload_dxf,
    f_s_name_table__from_o_model,
    o_model__o_dxffile,
    o_model__o_profile_template,
} from './constructors.js';

let o_component__profile_templates = {
    name: 'component-profile-templates',
    template: (await f_o_html_from_o_js({
        s_tag: 'div',
        class: 'o_profile_templates',
        a_o: [
            {
                s_tag: 'h2',
                innerText: 'Profile Templates',
            },
            {
                s_tag: 'p',
                class: 'o_profile_templates__description',
                innerText: 'Create templates that pair a profile with its remover. Use them on the DXF to OpenSCAD page.',
            },
            // Create new template form
            {
                s_tag: 'div',
                class: 'o_profile_templates__create_form',
                a_o: [
                    {
                        s_tag: 'h3',
                        innerText: 'Create new template',
                    },
                    {
                        s_tag: 'div',
                        class: 'o_profile_templates__form_row',
                        a_o: [
                            {
                                s_tag: 'div',
                                class: 'o_profile_templates__form_label',
                                innerText: 'Template name',
                            },
                            {
                                s_tag: 'input',
                                type: 'text',
                                'v-model': 's_name_new',
                                placeholder: 'e.g. Rose Profile A',
                                class: 'o_profile_templates__input',
                            },
                        ],
                    },
                    {
                        s_tag: 'div',
                        class: 'o_profile_templates__form_row',
                        a_o: [
                            {
                                s_tag: 'div',
                                class: 'o_profile_templates__form_label',
                                innerText: 'Profile (.dxf)',
                            },
                            {
                                s_tag: 'div',
                                class: 'o_profile_templates__file_area',
                                a_o: [
                                    {
                                        s_tag: 'input',
                                        type: 'file',
                                        accept: '.dxf',
                                        'v-on:change': "f_stage_file($event, 'profile')",
                                        class: 'o_dxf2scad__file_input',
                                    },
                                    {
                                        s_tag: 'span',
                                        'v-if': 's_name_file_profile',
                                        class: 'o_profile_templates__file_name',
                                        innerText: '{{ s_name_file_profile }}',
                                    },
                                ],
                            },
                        ],
                    },
                    {
                        s_tag: 'div',
                        class: 'o_profile_templates__form_row',
                        a_o: [
                            {
                                s_tag: 'div',
                                class: 'o_profile_templates__form_label',
                                innerText: 'Profile Remover (.dxf)',
                            },
                            {
                                s_tag: 'div',
                                class: 'o_profile_templates__file_area',
                                a_o: [
                                    {
                                        s_tag: 'input',
                                        type: 'file',
                                        accept: '.dxf',
                                        'v-on:change': "f_stage_file($event, 'profile_remover')",
                                        class: 'o_dxf2scad__file_input',
                                    },
                                    {
                                        s_tag: 'span',
                                        'v-if': 's_name_file_profile_remover',
                                        class: 'o_profile_templates__file_name',
                                        innerText: '{{ s_name_file_profile_remover }}',
                                    },
                                ],
                            },
                        ],
                    },
                    {
                        s_tag: 'div',
                        class: 'o_profile_templates__form_row',
                        a_o: [
                            {
                                s_tag: 'div',
                                ':class': "'interactable o_profile_templates__create_btn' + (b_can_create ? '' : ' disabled')",
                                'v-on:click': 'f_create_template',
                                innerText: "{{ b_creating ? 'Creating...' : 'Create Template' }}",
                            },
                            {
                                s_tag: 'div',
                                'v-if': 's_status',
                                class: 'o_profile_templates__status',
                                innerText: '{{ s_status }}',
                            },
                        ],
                    },
                ],
            },
            // Template list
            {
                s_tag: 'div',
                'v-if': 'a_o_profile_template.length > 0',
                class: 'o_profile_templates__list',
                a_o: [
                    {
                        s_tag: 'h3',
                        innerText: 'Existing templates',
                    },
                    {
                        s_tag: 'div',
                        'v-for': 'o_tpl in a_o_profile_template',
                        ':key': 'o_tpl.n_id',
                        class: 'o_profile_templates__item',
                        a_o: [
                            // Display mode
                            {
                                s_tag: 'div',
                                'v-if': 'n_id_editing !== o_tpl.n_id',
                                class: 'o_profile_templates__item_row',
                                a_o: [
                                    {
                                        s_tag: 'div',
                                        class: 'o_profile_templates__item_name',
                                        innerText: '{{ o_tpl.s_name }}',
                                    },
                                    {
                                        s_tag: 'div',
                                        class: 'o_profile_templates__item_details',
                                        a_o: [
                                            {
                                                s_tag: 'span',
                                                class: 'o_profile_templates__tag',
                                                innerText: '{{ f_s_dxffile_name(o_tpl.n_id_dxffile_profile, "profile") }}',
                                            },
                                            {
                                                s_tag: 'span',
                                                class: 'o_profile_templates__tag o_profile_templates__tag--remover',
                                                innerText: '{{ f_s_dxffile_name(o_tpl.n_id_dxffile_profile_remover, "remover") }}',
                                            },
                                        ],
                                    },
                                    {
                                        s_tag: 'div',
                                        class: 'o_profile_templates__item_actions',
                                        a_o: [
                                            {
                                                s_tag: 'div',
                                                class: 'interactable o_profile_templates__edit_btn',
                                                'v-on:click': 'f_start_edit(o_tpl)',
                                                innerText: 'edit',
                                            },
                                            {
                                                s_tag: 'div',
                                                class: 'interactable o_profile_templates__delete_btn',
                                                'v-on:click': 'f_delete_template(o_tpl)',
                                                innerText: 'delete',
                                            },
                                        ],
                                    },
                                ],
                            },
                            // Edit mode
                            {
                                s_tag: 'div',
                                'v-if': 'n_id_editing === o_tpl.n_id',
                                class: 'o_profile_templates__edit_form',
                                a_o: [
                                    {
                                        s_tag: 'div',
                                        class: 'o_profile_templates__form_row',
                                        a_o: [
                                            {
                                                s_tag: 'div',
                                                class: 'o_profile_templates__form_label',
                                                innerText: 'Template name',
                                            },
                                            {
                                                s_tag: 'input',
                                                type: 'text',
                                                'v-model': 's_name_edit',
                                                class: 'o_profile_templates__input',
                                            },
                                        ],
                                    },
                                    {
                                        s_tag: 'div',
                                        class: 'o_profile_templates__form_row',
                                        a_o: [
                                            {
                                                s_tag: 'div',
                                                class: 'o_profile_templates__form_label',
                                                innerText: 'Profile (.dxf)',
                                            },
                                            {
                                                s_tag: 'div',
                                                class: 'o_profile_templates__file_area',
                                                a_o: [
                                                    {
                                                        s_tag: 'span',
                                                        class: 'o_profile_templates__tag',
                                                        innerText: '{{ s_name_edit_file_profile || f_s_dxffile_name(o_tpl.n_id_dxffile_profile, "profile") }}',
                                                    },
                                                    {
                                                        s_tag: 'input',
                                                        type: 'file',
                                                        accept: '.dxf',
                                                        'v-on:change': "f_stage_edit_file($event, 'profile')",
                                                        class: 'o_dxf2scad__file_input',
                                                    },
                                                ],
                                            },
                                        ],
                                    },
                                    {
                                        s_tag: 'div',
                                        class: 'o_profile_templates__form_row',
                                        a_o: [
                                            {
                                                s_tag: 'div',
                                                class: 'o_profile_templates__form_label',
                                                innerText: 'Profile Remover (.dxf)',
                                            },
                                            {
                                                s_tag: 'div',
                                                class: 'o_profile_templates__file_area',
                                                a_o: [
                                                    {
                                                        s_tag: 'span',
                                                        class: 'o_profile_templates__tag o_profile_templates__tag--remover',
                                                        innerText: '{{ s_name_edit_file_profile_remover || f_s_dxffile_name(o_tpl.n_id_dxffile_profile_remover, "remover") }}',
                                                    },
                                                    {
                                                        s_tag: 'input',
                                                        type: 'file',
                                                        accept: '.dxf',
                                                        'v-on:change': "f_stage_edit_file($event, 'profile_remover')",
                                                        class: 'o_dxf2scad__file_input',
                                                    },
                                                ],
                                            },
                                        ],
                                    },
                                    {
                                        s_tag: 'div',
                                        class: 'o_profile_templates__form_row',
                                        a_o: [
                                            {
                                                s_tag: 'div',
                                                ':class': "'interactable o_profile_templates__save_btn' + (b_saving ? ' disabled' : '')",
                                                'v-on:click': 'f_save_edit(o_tpl)',
                                                innerText: "{{ b_saving ? 'Saving...' : 'Save' }}",
                                            },
                                            {
                                                s_tag: 'div',
                                                class: 'interactable o_profile_templates__cancel_btn',
                                                'v-on:click': 'f_cancel_edit',
                                                innerText: 'Cancel',
                                            },
                                            {
                                                s_tag: 'div',
                                                'v-if': 's_edit_status',
                                                class: 'o_profile_templates__status',
                                                innerText: '{{ s_edit_status }}',
                                            },
                                        ],
                                    },
                                ],
                            },
                        ],
                    },
                ],
            },
            {
                s_tag: 'div',
                'v-if': 'a_o_profile_template.length === 0',
                class: 'o_profile_templates__empty',
                innerText: 'No templates yet. Create one above.',
            },
        ],
    })).outerHTML,
    data: function() {
        return {
            o_state: o_state,
            s_name_new: '',
            s_dxf_content_profile: '',
            s_name_file_profile: '',
            s_dxf_content_profile_remover: '',
            s_name_file_profile_remover: '',
            s_status: '',
            b_creating: false,
            // Edit state
            n_id_editing: null,
            s_name_edit: '',
            s_dxf_content_edit_profile: '',
            s_name_edit_file_profile: '',
            s_dxf_content_edit_profile_remover: '',
            s_name_edit_file_profile_remover: '',
            s_edit_status: '',
            b_saving: false,
        };
    },
    computed: {
        a_o_profile_template: function() {
            return o_state[f_s_name_table__from_o_model(o_model__o_profile_template)] || [];
        },
        a_o_dxffile__all: function() {
            return o_state[f_s_name_table__from_o_model(o_model__o_dxffile)] || [];
        },
        b_can_create: function() {
            return this.s_name_new.trim() !== '' && this.s_dxf_content_profile !== '' && this.s_dxf_content_profile_remover !== '' && !this.b_creating;
        },
    },
    methods: {
        f_stage_file: async function(o_event, s_type) {
            let o_self = this;
            let o_file = o_event.target.files[0];
            if (!o_file) return;
            let s_content = await o_file.text();
            if (s_type === 'profile') {
                o_self.s_dxf_content_profile = s_content;
                o_self.s_name_file_profile = o_file.name;
            } else {
                o_self.s_dxf_content_profile_remover = s_content;
                o_self.s_name_file_profile_remover = o_file.name;
            }
        },
        f_create_template: async function() {
            let o_self = this;
            if (!o_self.b_can_create) return;
            o_self.b_creating = true;
            o_self.s_status = 'Uploading profile...';

            try {
                // Upload profile DXF
                let o_resp_profile = await f_send_wsmsg_with_response(
                    f_o_wsmsg(o_wsmsg__upload_dxf.s_name, {
                        s_dxf_content: o_self.s_dxf_content_profile,
                        s_name: o_self.s_name_file_profile,
                        s_type: 'profile',
                    })
                );
                if (o_resp_profile.s_error) {
                    o_self.s_status = 'Error uploading profile: ' + o_resp_profile.s_error;
                    return;
                }

                o_self.s_status = 'Uploading profile remover...';

                // Upload profile remover DXF
                let o_resp_remover = await f_send_wsmsg_with_response(
                    f_o_wsmsg(o_wsmsg__upload_dxf.s_name, {
                        s_dxf_content: o_self.s_dxf_content_profile_remover,
                        s_name: o_self.s_name_file_profile_remover,
                        s_type: 'profile_remover',
                    })
                );
                if (o_resp_remover.s_error) {
                    o_self.s_status = 'Error uploading remover: ' + o_resp_remover.s_error;
                    return;
                }

                o_self.s_status = 'Creating template...';

                // Create the template record
                let s_name_table = f_s_name_table__from_o_model(o_model__o_profile_template);
                await o_wsmsg__syncdata.f_v_sync({
                    s_name_table,
                    s_operation: 'create',
                    o_data: {
                        s_name: o_self.s_name_new.trim(),
                        n_id_dxffile_profile: o_resp_profile.v_result.o_dxffile.n_id,
                        n_id_dxffile_profile_remover: o_resp_remover.v_result.o_dxffile.n_id,
                    }
                });

                o_self.s_status = 'Template "' + o_self.s_name_new.trim() + '" created successfully';
                o_self.s_name_new = '';
                o_self.s_dxf_content_profile = '';
                o_self.s_name_file_profile = '';
                o_self.s_dxf_content_profile_remover = '';
                o_self.s_name_file_profile_remover = '';
            } catch (o_err) {
                o_self.s_status = 'Error: ' + o_err.message;
            } finally {
                o_self.b_creating = false;
            }
        },
        f_delete_template: async function(o_tpl) {
            let s_name_table = f_s_name_table__from_o_model(o_model__o_profile_template);
            await o_wsmsg__syncdata.f_v_sync({
                s_name_table,
                s_operation: 'delete',
                o_data: { n_id: o_tpl.n_id }
            });
            this.s_status = 'Template "' + o_tpl.s_name + '" deleted';
        },
        f_start_edit: function(o_tpl) {
            this.n_id_editing = o_tpl.n_id;
            this.s_name_edit = o_tpl.s_name;
            this.s_dxf_content_edit_profile = '';
            this.s_name_edit_file_profile = '';
            this.s_dxf_content_edit_profile_remover = '';
            this.s_name_edit_file_profile_remover = '';
            this.s_edit_status = '';
        },
        f_cancel_edit: function() {
            this.n_id_editing = null;
            this.s_edit_status = '';
        },
        f_stage_edit_file: async function(o_event, s_type) {
            let o_file = o_event.target.files[0];
            if (!o_file) return;
            let s_content = await o_file.text();
            if (s_type === 'profile') {
                this.s_dxf_content_edit_profile = s_content;
                this.s_name_edit_file_profile = o_file.name;
            } else {
                this.s_dxf_content_edit_profile_remover = s_content;
                this.s_name_edit_file_profile_remover = o_file.name;
            }
        },
        f_save_edit: async function(o_tpl) {
            let o_self = this;
            if (o_self.b_saving) return;
            o_self.b_saving = true;
            o_self.s_edit_status = 'Saving...';

            try {
                let o_update = { n_id: o_tpl.n_id };

                // Update name if changed
                if (o_self.s_name_edit.trim() !== '' && o_self.s_name_edit.trim() !== o_tpl.s_name) {
                    o_update.s_name = o_self.s_name_edit.trim();
                }

                // Upload new profile DXF if provided
                if (o_self.s_dxf_content_edit_profile) {
                    o_self.s_edit_status = 'Uploading profile...';
                    let o_resp = await f_send_wsmsg_with_response(
                        f_o_wsmsg(o_wsmsg__upload_dxf.s_name, {
                            s_dxf_content: o_self.s_dxf_content_edit_profile,
                            s_name: o_self.s_name_edit_file_profile,
                            s_type: 'profile',
                        })
                    );
                    if (o_resp.s_error) {
                        o_self.s_edit_status = 'Error uploading profile: ' + o_resp.s_error;
                        return;
                    }
                    o_update.n_id_dxffile_profile = o_resp.v_result.o_dxffile.n_id;
                }

                // Upload new profile remover DXF if provided
                if (o_self.s_dxf_content_edit_profile_remover) {
                    o_self.s_edit_status = 'Uploading profile remover...';
                    let o_resp = await f_send_wsmsg_with_response(
                        f_o_wsmsg(o_wsmsg__upload_dxf.s_name, {
                            s_dxf_content: o_self.s_dxf_content_edit_profile_remover,
                            s_name: o_self.s_name_edit_file_profile_remover,
                            s_type: 'profile_remover',
                        })
                    );
                    if (o_resp.s_error) {
                        o_self.s_edit_status = 'Error uploading remover: ' + o_resp.s_error;
                        return;
                    }
                    o_update.n_id_dxffile_profile_remover = o_resp.v_result.o_dxffile.n_id;
                }

                // Update the template record
                o_self.s_edit_status = 'Updating template...';
                let s_name_table = f_s_name_table__from_o_model(o_model__o_profile_template);
                await o_wsmsg__syncdata.f_v_sync({
                    s_name_table,
                    s_operation: 'update',
                    o_data: o_update,
                });

                o_self.s_edit_status = 'Saved';
                o_self.n_id_editing = null;
            } catch (o_err) {
                o_self.s_edit_status = 'Error: ' + o_err.message;
            } finally {
                o_self.b_saving = false;
            }
        },
        f_s_dxffile_name: function(n_id, s_fallback) {
            let o_dxf = this.a_o_dxffile__all.find(function(o) { return o.n_id === n_id; });
            return o_dxf ? o_dxf.s_name : '(' + s_fallback + ' missing)';
        },
    },
};

export { o_component__profile_templates };
