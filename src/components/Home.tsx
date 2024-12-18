/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import MonacoEditor from '@monaco-editor/react';
import { Button, Select, Alert } from 'antd';
import { createServer } from 'miragejs';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import Sk from 'skulpt';

const { Option } = Select;
const runPython = (code: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    let output = '';

    Sk.configure({
      output: (text: string) => {
        output += text;
      },
      read: (filename: string) => {
        if (
          Sk.builtinFiles === undefined ||
          Sk.builtinFiles['files'][filename] === undefined
        ) {
          throw new Error(`File not found: '${filename}'`);
        }
        return Sk.builtinFiles['files'][filename];
      },
    });

    Sk.misceval
      .asyncToPromise(() => Sk.importMainWithBody('<stdin>', false, code))
      .then(() => {
        if (output.trim()) {
          resolve(output);
        } else {
          resolve('Execution completed without output.');
        }
      })
      .catch((err: any) => {
        reject(err.toString());
      });
  });
};

createServer({
  routes() {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    this.post('/api/execute', async (schema, request) => {
      const { language, code } = JSON.parse(request.requestBody);

      try {
        if (language === 'javascript') {
          const result = eval(code);
          return { status: 'success', output: String(result) };
        } else if (language === 'python') {
          const output = await runPython(code);
          return { status: 'success', output };
        } else {
          throw new Error('Unsupported language');
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        return { status: 'error', error: error.message };
      }
    });
  },
});

export default function CodeEditorApp() {
  const [language, setLanguage] = useState('javascript');
  const [code, setCode] = useState('// Write your code here');
  const [result, setResult] = useState('');
  const [error, setError] = useState('');

  const handleRunCode = async () => {
    setError('');
    setResult('');
    try {
      const response = await fetch('/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language, code }),
      });
      const data = await response.json();
      if (data.status === 'success') {
        setResult(data.output);
      } else {
        setError(data.error);
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      setError('Server error occurred');
    }
  };

  return (
    <div className="p-4 flex flex-col gap-6">
      <h1 className="text-center text-2xl font-bold">Code Editor</h1>
      <Select
        value={language}
        onChange={setLanguage}
        className="w-full md:w-1/3"
        size="large"
      >
        <Option value="javascript">JavaScript</Option>
        <Option value="python">Python</Option>
      </Select>
      <MonacoEditor
        height="300px"
        defaultLanguage={language}
        value={code}
        onChange={value => setCode(value || '')}
        theme="vs-dark"
      />
      <Button type="primary" onClick={handleRunCode}>
        Run
      </Button>
      <div>
        {result && (
          <Alert message="Output" description={result} type="success" />
        )}
        {error && <Alert message="Error" description={error} type="error" />}
      </div>
    </div>
  );
}
