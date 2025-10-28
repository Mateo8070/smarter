import React from 'react';

// FIX: Define helper functions before they are used to prevent reference errors.
const parseInlineMarkdown = (text: string): React.ReactNode => {
  // Bold: **text**
  text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  // Italic: *text*
  text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
  
  // A bit of a hack to render HTML within React
  // FIX: Use React.createElement instead of JSX.
  return React.createElement('span', { dangerouslySetInnerHTML: { __html: text } });
};

// FIX: Define helper functions before they are used to prevent reference errors.
const parseTable = (tableLines: string[]): React.ReactElement => {
  // FIX: Use `,` to skip the unused `separatorLine` variable.
  const [headerLine, , ...bodyLines] = tableLines;
  
  const headers = headerLine.split('|').map(h => h.trim()).filter(Boolean);
  
  // FIX: Use React.createElement instead of JSX.
  return React.createElement(
    'table',
    null,
    React.createElement(
      'thead',
      null,
      React.createElement(
        'tr',
        null,
        ...headers.map((header, i) => React.createElement('th', { key: i }, header))
      )
    ),
    React.createElement(
      'tbody',
      null,
      ...bodyLines.map((rowLine, rowIndex) => {
        const cells = rowLine.split('|').map(c => c.trim()).filter(Boolean);
        return React.createElement(
          'tr',
          { key: rowIndex },
          ...cells.map((cell, cellIndex) => React.createElement('td', { key: cellIndex }, cell))
        );
      })
    )
  );
};

export const parseMarkdownToReact = (text: string): React.ReactNode => {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let currentList: string[] | null = null;
  let currentTable: string[] | null = null;

  const pushList = () => {
    if (currentList) {
      // FIX: Use React.createElement instead of JSX.
      elements.push(
        React.createElement(
          'ul',
          { key: elements.length },
          ...currentList.map((item, i) => React.createElement('li', { key: i }, parseInlineMarkdown(item)))
        )
      );
      currentList = null;
    }
  };
  
  const pushTable = () => {
    if (currentTable && currentTable.length > 1) { // Need at least header and separator
      // FIX: Use React.cloneElement to add a key to the table element, which is required for lists of elements.
      elements.push(React.cloneElement(parseTable(currentTable), { key: elements.length }));
    }
    currentTable = null;
  };

  lines.forEach((line, index) => {
    // Tables
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      if (!currentTable) currentTable = [];
      currentTable.push(line);
      return;
    } else if (currentTable) {
      pushTable();
    }
    
    // Lists
    if (line.trim().startsWith('* ')) {
      if (!currentList) currentList = [];
      currentList.push(line.trim().substring(2));
      return;
    } else if (currentList) {
      pushList();
    }

    // Paragraphs and other elements
    // FIX: Use React.createElement instead of JSX.
    elements.push(
      React.createElement(
        'p',
        { key: index },
        parseInlineMarkdown(line)
      )
    );
  });

  pushList(); // Push any remaining list
  pushTable(); // Push any remaining table

  return elements;
};
