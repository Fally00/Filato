# Filato

Filato is a browser-based file system interface that simulates a lightweight desktop environment.  
It allows users to manage files, monitor system resources, and interact with a structured UI — entirely on the client side.

## Live Demo

You Can test and interact with the full experaice here:

[Filato](https://abdelrahmanshaalan.github.io/Filato/home.html)

## Overview

Filato provides a desktop-like experience inside the browser, combining file management with simulated system monitoring.  
All data is stored locally using the browser’s storage mechanisms, with no backend dependency.

## Features

- File and folder creation and deletion
- Text file preview, editing, and persistence
- Simulated CPU, memory, and disk usage
- Resource usage visualization with charts
- Activity logging system
- Modular and extensible architecture

## Technology Stack

- HTML5
- CSS3
- JavaScript (ES6)
- ApexCharts
- Browser Local Storage

## Project Structure
```
Filato/
├── images/           # UI assets (icons, images)
├── style.css         # Application styles
├── main.js           # Core JavaScript logic
├── index.html        # Entry point
├── home.html         # Main interactive interface
└── README.md         # Project documentation
```
## Installation and Usage

- To run Filato locally:

- Clone the repositorygit clone -> ( https://github.com/AbdelrahmanShaalan/Filato.git )

- Open home.html in a web browser.

- Optionally, serve via a local HTTP server:
```
npx http-server
```
Interact with the file editor and explore the available panels.

## Notes

- This project is a simulation and does not interact with the real file system.

- Resource usage values are generated dynamically for demonstration purposes.

- Best experienced on tablet or desktop screens.

## License

This project is distributed under the MIT License, allowing for modification, redistribution, and personal or commercial use.

