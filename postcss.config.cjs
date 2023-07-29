module.exports = {
  plugins: [
    require('postcss-normalize'),
    require('autoprefixer')({
      grid: true
    })
  ],
};
