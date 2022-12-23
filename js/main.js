/*----- constants -----*/

ships = [
    {
        name: 'CARRIER',
        width: 5,
        color: '#FFAD00',
        translateCordinates: [], // x, y
        squaresOccupied: [], 
        dom: null
    },
    {
        name: 'BATTLESHIP',
        width: 4,
        color: '#39ff14',
        translateCordinates: [], // x, y 
        squaresOccupied: [],
        dom: null
    },
    {
        name: 'DESTROYER',
        width: 3,
        color: '#FF10F0',
        translateCordinates: [], // x, y 
        squaresOccupied: [],
        dom: null
    },
    {
        name:'SUBMARINE',
        width: 3,
        color: '#04d9ff',
        translateCordinates: [], // x, y 
        squaresOccupied: [],
        dom: null
    },
    {
        name: 'PATROL',
        width: 2,
        color: '#FFF01F',
        translateCordinates: [], // x, y 
        squaresOccupied: [],
        dom: null
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
let player1, player2, curPlayer
let curShip = {}

/*----- cached element references -----*/
const playComEl = document.getElementById('vsComputer')
const player1BoardEl = document.getElementById('player1Board')


/*----- event listeners -----*/
playComEl.addEventListener('click', startGame)
player1BoardEl.addEventListener('dragover', dragOver)
player1BoardEl.addEventListener('drop', dragDrop)


/*----- functions -----*/

function startGame() {
    playComEl.style.display = 'none'
    player1 = new Player(1, false)
    player2 = new Player(2, true)
    player1BoardEl.style.display = 'block'
    buildShips(player1)
    curPlayer = player1
}

function buildShips(player) {
    player.ships.forEach( ship => {
        const newShip = document.createElement('div')
        newShip.setAttribute('class', 'ship')
        newShip.setAttribute('draggable', true)
        newShip.setAttribute('id', ship.name)
        newShip.style.backgroundColor = ship.color
        newShip.style.width = `${ship.width * 3}rem`
        newShip.innerText = ship.name
        newShip.addEventListener('dragstart', dragStart)
        document.querySelector('#shipYard').appendChild(newShip)
    })
}

function dragStart(e) {
    curShip.domEl = e.target
    curShip.shipGrabbedX = e.offsetX
    curShip.shipGrabbedY = e.offsetY
}

function dragOver(e) {
    e.preventDefault()
}

function dragDrop(e) {
    e.preventDefault()
    const dropX = calcCordinate(e.offsetX, curShip.shipGrabbedX)+2
    const dropY = calcCordinate(e.offsetY, curShip.shipGrabbedY)+1
    logCordinates(dropX,dropY)
    // validate that the dropped ship is in a correct place
    console.log(e.offsetX,e.offsetY)
    console.log(curShip.shipGrabbedX,curShip.shipGrabbedY)
    console.log(dropX,dropY)
    // might want to move this to some kind of render function but idk
    curShip.domEl.style.transform = `translate(${dropX}px,${dropY}px)`
    curShip.domEl.style.position = 'absolute'
    curShip.domEl.classList.add('placed')
    player1BoardEl.appendChild(curShip.domEl)
}

function calcCordinate(drop,grab) {
    let result = Math.round((drop - grab) / 49) * 49
    // if (result < 52) {
    //     const ship = curPlayer.ships.find(ship => ship.name === curShip.domEl.id)
    //     result = Math.round((ship.translateCordinates[0] - drop) / 49) * 49
    // }
    return result
}

function logCordinates(x,y) {
    const ship = curPlayer.ships.find(ship => ship.name === curShip.domEl.id)
    ship.translateCordinates = [x,y]
}


// testing
player1BoardEl.addEventListener('click', testCordinates)
function testCordinates(e){
    const x = e.offsetX
    const y = e.offsetY
    console.log(e.target.style.transform)
}