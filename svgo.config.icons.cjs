module.exports = {
  plugins: [
    {
      name: 'preset-default',
      params: {
        overrides: {
          removeViewBox: false,
        },
      },
    },
    {
      name: 'addClassesToSVGElement',
      params: {
        className: 'icon'
      },
    },
    {
      name: 'addAttributesToSVGElement',
      params: {
        attributes: [
          {
            'aria-hidden': true
          }
        ]
      }
    },
    {
      name: 'removeAttributesBySelector',
      params: {
        selector: '[fill="none"],[fill="#000"],[fill="#000000"]',
        attributes: 'fill',
      },
    },
    {
      name: 'removeAttrs',
      params: {
        attrs: 'fill-rule',
      },
    },
  ],
}
