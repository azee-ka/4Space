const symbols = {
  '\\sqrt{x}': ['\\sqrt{ }', 1],
  '\\sqrt[{n}]{x}': ['\\sqrt[{ }]{ }', 2],
  '\\frac{d}{dx}': ['\\frac{d}{dx}\\left({ }\\right)', 1],
  '\\frac{\\partial}{\\partial x}': ['\\frac{\\partial}{\\partial x}\\left({ }\\right)', 1],
  '\\int{}': ['\\int', 0],
  '\\int_{a}^{b}': ['\\int_{ }^{ }\\left({ }\\right)', 4],
  // '\\oint': ['\\oint\\left({ }\\right)', 1],
  '\\sum': ['\\sum_{i={ }}^{ }\\left({ }\\right)', 4],
  '\\prod{}': ['\\prod_{i={}}^{ }\\left({ }\\right)', 4],
  '\\lim_{}{}': [' \\lim_{x \\to } \\left( { } \\right)', 3],
  '\\left[\\right]': ['\\left[\\right]', 1],
  // '\\bar{}': ['\\bar{}', 1],
  '\\degree': ['\\degree'],
  '\\leq': ['\\leq'],
  '\\geq': ['\\geq'],
  '\\neq': ['\\neq'],
  '\\hat{i}': ['\\hat{x}', 0],
  '\\theta': ['\\theta'],
  '\\infty': ['\\infty'],
  '\\pi': ['\\pi'],
  'e': ['e'],
  '\\ln{}': ['\\ln{\\left(\\right) }', 1],
  '\\log_{a}{b}': [' \\log_{ } \\left( { } \\right)', 3],

  // '\\prime': ['\\prime'],
  // '\\Gamma': ['\\Gamma\\left({}\\right)', 1],
  '\\sin': ['\\sin{\\left(\\right)}', 1],
  '\\cos': ['\\cos{\\left(\\right) }', 1],
  '\\tan': ['\\tan{\\left(\\right) }', 1],
  '\\sin^{-1}': ['\\sin^{-1}\\left(\\right)', 1],
  '\\cos^{-1}': ['\\cos^{-1}\\left(\\right)', 1],
  '\\tan^{-1}': ['\\tan^{-1}\\left(\\right)', 1],

  '\\lfloor{ }\\rfloor': ['\\lfloor{\\left(\\right) }\\rfloor', 2],
  '\\lceil{ }\\rceil': ['\\lceil{\\left(\\right) }\\rceil', 2],
  '\\lceil{ }\\rfloor': ['\\lceil{\\left(\\right) }\\rfloor', 2],
};


const greekLetters = {
  // lower greek letters
  'α': ['\\alpha', 0],
  'β': ['\\beta', 0],
  'γ': ['\\gamma', 0],
  'δ': ['\\delta', 0],
  'ε': ['\\epsilon', 0],
  'ζ': ['\\zeta', 0],
  'η': ['\\eta', 0],
  'θ': ['\\theta', 0],
  'ι': ['\\iota', 0],
  'κ': ['\\kappa', 0],
  'λ': ['\\lambda', 0],
  'μ': ['\\mu', 0],
  'ν': ['\\nu', 0],
  'ξ': ['\\xi', 0],
  'ο': ['\\omicron', 0],
  'π': ['\\pi', 0],
  'ρ': ['\\rho', 0],
  'σ': ['\\sigma', 0],
  'τ': ['\\tau', 0],
  'υ': ['\\upsilon', 0],
  'φ': ['\\phi', 0],
  'χ': ['\\chi', 0],
  'ψ': ['\\psi', 0],
  'ω': ['\\omega', 0],
  // upper greek letters
  'Α': ['A', 0],
  'Β': ['B', 0],
  'Γ': ['\\Gamma', 0],
  'Δ': ['\\Delta', 0],
  'Ε': ['E', 0],
  'Ζ': ['Z', 0],
  'Η': ['H', 0],
  'Θ': ['\\Theta', 0],
  'Ι': ['I', 0],
  'Κ': ['K', 0],
  'Λ': ['\\Lambda', 0],
  'Μ': ['M', 0],
  'Ν': ['N', 0],
  'Ξ': ['\\Xi', 0],
  'Ο': ['O', 0],
  'Π': ['\\Pi', 0],
  'Ρ': ['P', 0],
  'Σ': ['\\Sigma', 0],
  'Τ': ['T', 0],
  'Υ': ['\\Upsilon', 0],
  'Φ': ['\\Phi', 0],
  'Χ': ['X', 0],
  'Ψ': ['\\Psi', 0],
  'Ω': ['\\Omega', 0],
};


const calculusSymbols = {
  '\\frac{d}{dx}': ['\\frac{d}{dx}\\left({ }\\right)', 1],
  '\\frac{\\partial}{\\partial x}': ['\\frac{\\partial}{\\partial x}\\left({ }\\right)', 1],
  '\\int{}': ['\\int', 0],
  '\\int_{a}^{b}': ['\\int_{ }^{ }\\left({ }\\right)', 4],
  '\\int_{a}^{b}\\int_{a}^{b}': ['\\int_{ }^{ }\\left({ }\\right)\\int_{ }^{ }\\left({ }\\right)', 4],
  '\\int_{a}^{b} \\int_{a}^{b} \\int_{a}^{b}': ['\\int_{ }^{ }\\left({ }\\right) \\int_{ }^{ }\\left({ }\\right) \\int_{ }^{ }\\left({ }\\right)', 4],
};

const trig = {
  'sin': ['\\sin{\\left(\\right) }', 1],
  'cos': ['\\cos{\\left(\\right) }', 1],
  'tan': ['\\tan{\\left(\\right) }', 1],
  'csc': ['\\csc{\\left(\\right) }', 1],
  'sec': ['\\sec{\\left(\\right) }', 1],
  'cot': ['\\cot{\\left(\\right) }', 1],

  'sinh': ['\\sinh{\\left(\\right) }', 1],
  'cosh': ['\\cosh{\\left(\\right) }', 1],
  'tanh': ['\\tanh{\\left(\\right) }', 1],
  'csch': ['\\csch{\\left(\\right) }', 1],
  'sech': ['\\sech{\\left(\\right) }', 1],
  'coth': ['\\coth{\\left(\\right) }', 1],

  '\\sin^{-1}': ['\\sin^{-1}\\left(\\right)', 1],
  '\\cos^{-1}': ['\\cos^{-1}\\left(\\right)', 1],
  '\\tan^{-1}': ['\\tan^{-1}\\left(\\right)', 1],

};


// const linearAlgebra = {
//   // existing entries...
//   '\\vec{v}': ['\\vec{ }', 1], // vector
//   '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}': ['\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}', 1], // matrix
//   '\\det': ['\\det\\left({}\\right)', 1], // determinant
//   '\\mathrm{Trace}': ['\\mathrm{Tr}\\left({}\\right)', 1], // trace
//   '\\mathrm{rank}': ['\\mathrm{rank}\\left({}\\right)', 1], // rank
//   '\\mathrm{null}': ['\\mathrm{null}\\left({}\\right)', 1], // null space
//   '\\mathrm{Span}': ['\\mathrm{Span}\\left({}\\right)', 1], // span
//   '\\dim': ['\\mathrm{dim}\\left({}\\right)', 1], // dimension
//   '\\ker': ['\\mathrm{ker}\\left({}\\right)', 1], // kernel
// };


export { symbols, greekLetters, calculusSymbols as upperGreekLetters, trig }