import React from 'react';

const App: React.FC = () => {
  const handleDownload = () => {
    const textContent = 'oi';
    const filename = 'oi.txt';
    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });

    // Create a temporary URL for the blob
    const url = URL.createObjectURL(blob);

    // Create a link element
    const a = document.createElement('a');
    a.href = url;
    a.download = filename; // Set the download filename

    // Programmatically click the link to trigger the download
    document.body.appendChild(a); // Append to body is good practice for cross-browser compatibility
    a.click();

    // Clean up: remove the link and revoke the URL
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-6 text-center">
        Gerador de Arquivo TXT Simples
      </h1>
      <p className="text-lg text-gray-600 mb-8 text-center max-w-md">
        Clique no botão abaixo para gerar e baixar um arquivo de texto (<span className="font-semibold">oi.txt</span>) com a palavra "oi".
      </p>
      <button
        onClick={handleDownload}
        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg
                   focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75
                   transition duration-300 ease-in-out transform hover:scale-105"
      >
        Baixar 'oi.txt'
      </button>
    </div>
  );
};

export default App;