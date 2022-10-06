export default {
  '**/*.ts?(x)': () => 'tsdx lint --fix --ignore-pattern src/types/contracts',
}
