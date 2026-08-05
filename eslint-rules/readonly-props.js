/**
 * Component props must be wrapped in `Readonly<>`.
 *
 * Heuristic: flags a first parameter typed as `SomethingProps`, or as an inline
 * object literal, on a PascalCase function — i.e. a component. Deliberately
 * narrower than `@typescript-eslint/prefer-readonly-parameter-types`, which is
 * deep-readonly and flags every parameter in the codebase.
 */
export const readonlyProps = {
  meta: {
    type: 'problem',
    docs: { description: 'Require component props to be wrapped in Readonly<>' },
    messages: {
      notReadonly:
        'Component props must be wrapped in Readonly<> (e.g. `Readonly<{{name}}>`).',
    },
    fixable: 'code',
    schema: [],
  },
  create(context) {
    const isComponentName = (n) => typeof n === 'string' && /^[A-Z]/.test(n);

    function check(node, name) {
      if (!isComponentName(name)) return;
      const param = node.params[0];
      if (!param?.typeAnnotation?.typeAnnotation) return;
      const t = param.typeAnnotation.typeAnnotation;

      // Already Readonly<...> — fine.
      if (t.type === 'TSTypeReference' && t.typeName?.name === 'Readonly') {
        return;
      }

      const isPropsRef =
        t.type === 'TSTypeReference' &&
        t.typeName?.type === 'Identifier' &&
        /Props$/.test(t.typeName.name);
      const isInlineObject = t.type === 'TSTypeLiteral';

      if (!isPropsRef && !isInlineObject) return;

      context.report({
        node: param,
        messageId: 'notReadonly',
        data: { name: isPropsRef ? t.typeName.name : '{ ... }' },
        fix(fixer) {
          const source = context.sourceCode.getText(t);
          return fixer.replaceText(t, `Readonly<${source}>`);
        },
      });
    }

    return {
      FunctionDeclaration(node) {
        check(node, node.id?.name);
      },
      VariableDeclarator(node) {
        if (
          node.init &&
          (node.init.type === 'ArrowFunctionExpression' ||
            node.init.type === 'FunctionExpression')
        ) {
          check(node.init, node.id?.name);
        }
      },
    };
  },
};
