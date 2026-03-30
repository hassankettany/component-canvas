export const DEFAULT_COMPONENT_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Component</title>
    <style>
        body {
            font-family: system-ui, -apple-system, sans-serif;
            padding: 2rem;
            margin: 0;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
        }
        h1 {
            color: #4f46e5;
            margin-bottom: 1rem;
        }
        p {
            color: #64748b;
            line-height: 1.6;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Hello World</h1>
        <p>Start building your component!</p>
        <button onclick="alert('Hello!')">Click Me</button>
    </div>

    <script>
        console.log('Component loaded!');
    </script>
</body>
</html>`;
