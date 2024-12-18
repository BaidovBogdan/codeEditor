import { useState } from 'react';
import MonacoEditor from '@monaco-editor/react';
import { Button, Select, Alert } from 'antd';
import { createServer } from 'miragejs';

const { Option } = Select;

createServer({
  routes() {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    this.post('/api/execute', (schema, request) => {
      const { language, code } = JSON.parse(request.requestBody);

      try {
        if (language === 'javascript') {
          const result = eval(code);
          return { status: 'success', output: String(result) };
        } else if (language === 'python') {
          if (code.includes('print')) {
            return {
              status: 'success',
              output: code.replace('print(', '').replace(')', ''),
            };
          } else {
            throw new Error('NameError: name "print" is not defined');
          }
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
      {result && <Alert message="Output" description={result} type="success" />}
      {error && <Alert message="Error" description={error} type="error" />}
    </div>
  );
}
