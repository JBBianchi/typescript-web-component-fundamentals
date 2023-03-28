// import commonjs from '@rollup/plugin-commonjs';
// import json from '@rollup/plugin-json';
import resolve from '@rollup/plugin-node-resolve';
import sourceMaps from 'rollup-plugin-sourcemaps';
import { terser } from 'rollup-plugin-terser';
import typescript from 'rollup-plugin-typescript2';

export default {
  input: 'src/index.ts',
  output: {
    dir: 'dist',
    name: 'CustomComponent',
    sourcemap: true,
    format: 'umd'
  },
  // output: [
  //   { file: 'dist/umd/custom-component.umd.js', name: 'customComponent', format: 'umd', sourcemap: true },
  //   {
  //     file: 'dist/umd/custom-component.umd.min.js',
  //     name: 'customComponent',
  //     format: 'umd',
  //     sourcemap: true,
  //     plugins: [terser()],
  //   },
  //   { file: 'dist/esm/custom-component.esm.js', format: 'es', sourcemap: true },
  //   { file: 'dist/esm/custom-component.esm.min.js', format: 'es', sourcemap: true, plugins: [terser()] },
  //   { file: 'dist/systemjs/custom-component.systemjs.js', format: 'system', sourcemap: true },
  //   { file: 'dist/systemjs/custom-component.systemjs.min.js', format: 'system', sourcemap: true, plugins: [terser()] },
  // ],
  plugins: [typescript({ useTsconfigDeclarationDir: true }), resolve(), sourceMaps()],
};