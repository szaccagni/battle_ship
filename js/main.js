/*----- constants -----*/
ships = [
    {
        name: 'CARRIER',
        width: 5,
        color: '#FFAD00',
        dom: null,
        translateCordinates: [],
        rotated: -1,
        squaresOccupied: [], 
    },
    {
        name: 'BATTLESHIP',
        width: 4,
        color: '#39ff14',
        dom: null,
        translateCordinates: [],
        rotated: -1,
        squaresOccupied: [],
    },
    {
        name: 'DESTROYER',
        width: 3,
        color: '#FF10F0',
        dom: null,
        translateCordinates: [], 
        rotated: -1,
        squaresOccupied: [],
    },
    {
        name:'SUBMARINE',
        width: 3,
        color: '#04d9ff',
        dom: null,
        translateCordinates: [],
        rotated: -1,
        squaresOccupied: [],
    },
    {
        name: 'PATROL',
        width: 2,
        color: '#FFF01F',
        dom: null,
        translateCordinates: [],
        rotated: -1,
        squaresOccupied: [],
    },
]

class Player {
    constructor(id, automated) {
        this.id = id
        this.automated = automated
        this.ships = [...ships]
    }
}

/*----- app's state (variables) -----*/
let player1, player2, curPlayer, curShip

/*----- cached element references -----*/
const playComEl = document.getElementById('vsComputer')
const player1BoardEl = document.getElementById('player1Board')

/*----- event listeners -----*/
playComEl.addEventListener('click', startGame)
player1BoardEl.addEventListener('dragover', dragOver)
player1BoardEl.addEventListener('drop', dragDrop)

/*----- functions -----*/
function startGame() {
    player1 = new Player(1, false)
    player2 = new Player(2, true)
    curPlayer = player1
    playComEl.style.display = 'none'
    player1BoardEl.style.display = 'block'
    buildShips(player1)
}

function getCurShip(e) {
    if (!e.target.id) {
        curShip = curPlayer.ships.find(ship => ship.name === e.target.parentElement.id)
        curShip.dom = e.target.parentElement
    } else {
        curShip = curPlayer.ships.find(ship => ship.name === e.target.id)
        curShip.dom = e.target
    }
}

function dragStart(e) {
    getCurShip(e)
    curShip.shipGrabbedX = e.offsetX
    curShip.shipGrabbedY = e.offsetY
}

function dragOver(e) {
    if(e.target !== curShip.dom && e.target !== curShip.dom.firstChild) e.preventDefault()
}

function dragDrop(e) {
    console.log('drop')
    e.preventDefault()
    let dropX = calcCordinate(e.offsetX, curShip.shipGrabbedX)+2
    let dropY = calcCordinate(e.offsetY, curShip.shipGrabbedY)+1
    validateDrop(dropX,dropY)
    transformShipCordinates(dropX,dropY)
    dropShip()
}

function clickShip(e) {
    console.log('click')
    getCurShip(e)
    if (curShip && curShip.dom.parentElement.id.search('Board') > 0) {
        rotateShip()
    }       
}

function calcCordinate(drop,grab) {
    let result = Math.round((drop - grab) / 49) * 49
    return result
}

function logCordinates(x,y) {
    curShip.translateCordinates = [x,y]
}

function validateDrop(x,y) {
    if ((x + curShip.dom.offsetWidth > 494) || (x < 0)) {
        console.log('x is off')
    } else {
        console.log('x is ok')
    }
}

/*----- render functions -----*/
function buildShips(player) {
    player.ships.forEach( ship => {
        const newShip = document.createElement('div')
        const newShipStyle = document.createElement('div')
        newShip.appendChild(newShipStyle)
        newShip.setAttribute('draggable', true)
        newShip.setAttribute('class', 'ship')
        newShip.setAttribute('id', ship.name)
        newShip.addEventListener('dragstart', dragStart)
        newShipStyle.setAttribute('class', 'ship-style')
        newShipStyle.style.backgroundColor = ship.color
        newShipStyle.style.width = `${ship.width * 3}rem`
        newShipStyle.innerText = ship.name
        newShipStyle.addEventListener('click', clickShip)
        document.querySelector('#shipYard').appendChild(newShip)
    })
}

function dropShip() {
    console.log('dropShip')
    curShip.dom.style.position = 'absolute'
    curShip.dom.classList.add('placed')
    player1BoardEl.appendChild(curShip.dom)
}

function transformShipCordinates(x,y) {
    console.log('transformShip')
    if(curShip.width % 2 === 0) {
        if (curShip.rotated === 1) {
            x += 25
            y -= 25
        } 
    }
    curShip.dom.style.transform = `translate(${x}px,${y}px)`
    logCordinates(x,y)
}

function rotateShip() {
    console.log('rotate')
    curShip.dom.firstChild.style.transform = curShip.rotated === 1 ? '' : 'rotate(90deg)'
    curShip.rotated *= -1
    let x = curShip.translateCordinates[0]
    let y = curShip.translateCordinates[1]
    if(curShip.width % 2 === 0) {
        if (curShip.rotated === -1) {
            x -= 25
            y += 25
        }
    }
    transformShipCordinates(x,y)
}

// // // testing
// // player1BoardEl.addEventListener('click', test)
// // function test(e){
// //     testEl = curPlayer.ships.find(ship => ship.name === curShip.dom.id)
// //     testEl.test = 'hi'
// //     console.log(testEl)

// // }