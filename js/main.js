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
    // move to render
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
    e.preventDefault()
    let dropX = (Math.round((e.offsetX - curShip.shipGrabbedX) / 49) * 49)+2
    let dropY = (Math.round((e.offsetY - curShip.shipGrabbedY) / 49) * 49)+1
    validateDrop(dropX,dropY)
    dropShip(dropX,dropY)
}

function clickShip(e) {
    getCurShip(e)
    validateDrop(curShip.translateCordinates[0],curShip.translateCordinates[1])
    if (curShip && curShip.dom.parentElement.id.search('Board') > 0) {
        rotateShip()
    }       
}

function validateDrop(x,y) {
    // check horizontal placemenet
    if ((x + curShip.dom.offsetWidth > 494) || (x < 0)) {
        console.log('x is off')
    } else {
        console.log('x is ok')
    }
    // check vertical placement
    if ((y + curShip.dom.firstChild.offsetWidth > 494) || (y < 0)){
        console.log('y is off')
    } else {
        console.log('y is okay')
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
        newShip.style.width = `${ship.width * 3}rem`
        newShip.addEventListener('dragstart', dragStart)
        newShipStyle.setAttribute('class', 'ship-style')
        newShipStyle.style.backgroundColor = ship.color
        newShipStyle.style.width = `${ship.width * 3}rem`
        newShipStyle.innerText = ship.name
        newShipStyle.addEventListener('click', clickShip)
        document.querySelector('#shipYard').appendChild(newShip)
    })
}

function dropShip(x,y) {
    curShip.dom.style.transform = `translate(${x}px,${y}px)`
    curShip.translateCordinates = [x,y]
    curShip.dom.style.position = 'absolute'
    curShip.dom.classList.add('placed')
    player1BoardEl.appendChild(curShip.dom)
}

function rotateShip() {
    curShip.dom.style.width = curShip.rotated === 1 ? `${curShip.width * 3}rem` : '3rem'
    let rotateBy
    if (curShip.width % 2 === 0) {
        if (curShip.rotated === -1) {
            rotateBy = (curShip.width * 12) + (25 * (curShip.width/2 - 1)) - (curShip.width/2 - 1)
        } 
    } else {
        if (curShip.rotated === -1) {
            rotateBy = (Math.round(((curShip.width * 12) + 25)/48) * 48) + 1  
        } 
    }
    curShip.dom.firstChild.style.transform = curShip.rotated === 1 ? '' : `translate(-${rotateBy}px,${rotateBy}px) rotate(90deg)`
    curShip.rotated *= -1
}

// // // testing
// // player1BoardEl.addEventListener('click', test)
// // function test(e){
// //     testEl = curPlayer.ships.find(ship => ship.name === curShip.dom.id)
// //     testEl.test = 'hi'
// //     console.log(testEl)

// // }