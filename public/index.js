let editor = CodeMirror.fromTextArea(document.getElementById('editor'), {
  lineNumbers: true,
  tabSize: 2,
  mode: 'text/x-python', // Specify mode here
  theme: 'monokai',
  autoCloseBrackets: true,
  matchBrackets: true
})

let output = document.getElementById('output')
let input = document.getElementById('input')
let fileName = document.getElementById('file')
let savename = document.getElementById('savename')
let popup = document.getElementById('popup')
let option = document.getElementById('inlineFormSelectPref')
const originalPopupHTML = document.getElementById('popup').innerHTML;

option.addEventListener('change', function () {
  if (option.value == '62') {
    editor.setOption('mode', 'text/x-java')
    editor
      .getDoc()
      .setValue(
        '//Always use class name Main \nclass Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}\n'
      )
  } else if (option.value == '71') {
    editor.setOption('mode', 'text/x-python')
    editor.getDoc().setValue('print("Hello, World!")')
  } else if (option.value == '50') {
    editor.setOption('mode', 'text/x-csrc')
    editor
      .getDoc()
      .setValue(
        '#include <stdio.h>\n\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}\n'
      )
  } else {
    editor.setOption('mode', 'text/x-c++src')
    editor
      .getDoc()
      .setValue(
        '#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello, World!" << endl;\n    return 0;\n}\n'
      )
  }
})

document.getElementById('saveFileBtn').addEventListener('click', function () {
    popup.classList.toggle('d-none')
  })

popup.addEventListener('click', function (event) {
  // Check if the click event is from the close button
  if (event.target && event.target.id === 'close') {
    // Perform your close logic here
    popup.classList.add('d-none') // Hide the popup
    popup.innerHTML = originalPopupHTML;
  }
})

document.addEventListener('click', function (event) {
  // Check if the click event is from the save button
  if (event.target && event.target.id === 'savename') {
    saveFileHandler();
  }
});

// Define the event handler for saving the file
async function saveFileHandler() {
  console.log('clicked');
  try {
    popup.innerHTML = `<img class="w-25" src="/loading.gif"/>`;
    const file_Name = fileName.value;
    const fileData = editor.getValue();

    console.log(file_Name);
    // Make a POST request to your server
    const response = await fetch('/saveFile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fileName: file_Name,
        fileData: fileData
      })
    });

    if (!response.ok) {
      throw new Error('Failed to save file');
    }

    // Assuming the server responds with the URL of the saved file
    const responseData = await response.json();

    console.log(responseData);

    // Show a popup with the URL of the saved file
    popup.innerHTML = `<a href="${responseData.gistUrl}" target="_blank" class="d-block p-4" a>Click to Access File</a>
           <button id="close" class="btn btn-warning m-3">Close</button>`;
  } catch (error) {
    console.error(error);
  }
}



// Function to display loading gif in the output textarea
function showLoading () {
  output.value = ''
  output.style.backgroundImage = "url('loading.gif')"
  output.style.backgroundRepeat = 'no-repeat'
  output.style.backgroundPosition = 'center'
}

// Function to remove loading gif and display the received output
function showOutput (outputData) {
  output.style.backgroundImage = 'none' // Remove loading.gif
  output.value = outputData // Display the received output
}

run.addEventListener('click', async function () {
  try {
    const code = {
      code: editor.getValue(),
      input: input.value,
      lang: option.value
    }

    showLoading()

    const response = await fetch('/compile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(code)
    })

    if (!response.ok) {
      throw new Error('Network response was not ok')
    }
    const data = await response.text()

    showOutput(data)
  } catch (err) {
    console.error(err)
  }
})
