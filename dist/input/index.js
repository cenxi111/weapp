Component({
    behaviors: ['wx://form-field'],

    externalClasses: ['i-class'],

    options: {
        multipleSlots: true
    },

    relations: {
        '../cell-group/index': {
            type: 'parent'
        }
    },

    properties: {
        title: {
            type: String
        },
        // text || textarea || password || number
        type: {
            type: String,
            value: 'text'
        },
        disabled: {
            type: Boolean,
            value: false
        },
        placeholder: {
            type: String,
            value: ''
        },
        autofocus: {
            type: Boolean,
            value: false
        },
        clearable: {
            type: Boolean,
            value: true
        },
        iconType: {
            type: String,
            value: ''
        },
        mode: {
            type: String,
            value: 'normal'
        },
        right: {
            type: Boolean,
            value: false
        },
        error: {
            type: Boolean,
            value: false
        },
        maxlength: {
            type: Number
        },
        required: {
            type: Boolean
        },
        value: {
            type: String,
            value: ''
        },
        iconColor: {
            type: String,
            value: '#80848f'
        },
        showArrow: {
            type: Boolean,
            value: false
        },
        custom: {
            type: Boolean,
            value: false
        }
    },

    data: {
        focused: false,
        isLastCell: true
    },

    methods: {
        handleInputChange(event) {
            const { detail = {} } = event
            const { value = '' } = detail
            this.setData({ value }, () => {
                this.triggerEvent('change', {
                    value,
                    event
                })
            })
        },

        handleInputFocus(event) {
            this.setData({
                focused: true
            })
            this.triggerEvent('focus', event)
        },

        handleInputBlur(event) {
            this.setData({
                focused: false
            })
            this.triggerEvent('blur', event)
        },

        handleClearValue (event) {
            this.setData({ value: '' }, () => {
                event.detail.value = ''
                this.triggerEvent('change', {
                    value: '',
                    event
                })
            })
        },

        updateIsLastCell (isLastCell) {
            this.setData({ isLastCell });
        },

        handleIconTap (event) {
            this.triggerEvent('icon-tap', event)
        },

        handleTap (event) {
            if (this.data.disabled) {
                this.triggerEvent('click', event)
            }
        }
    }
});
