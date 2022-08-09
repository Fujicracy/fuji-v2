export default {
  // lint-staged appends all staged files to the command
  // but "forge fmt" can be run on the entire project or a single file.
  // So when there are more than one staged file, it fails.
  // That's why we customize the run.
  '**/*.sol?(x)': () => 'forge fmt',
}
