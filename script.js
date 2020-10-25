import * as THREE from 'https://threejsfundamentals.org/threejs/resources/threejs/r119/build/three.module.js';
import {OrbitControls} from 'https://threejsfundamentals.org/threejs/resources/threejs/r119/examples/jsm/controls/OrbitControls.js';



// variables for event listeners
const beginBtn = document.querySelector('#btn-begin');
const overlay = document.querySelector('#overlay');
const threeJsWindow = document.querySelector('#three-js-container');
const closeBtn = document.querySelector('#btn-close');

let currentObject;

// loader
const loadingElem = document.querySelector('#loading');
const progressBarElem = loadingElem.querySelector('.progressbar');

let windowHalfX = window.innerWidth / 2;
let windowHalfY = window.innerHeight / 2;

let orbiting = false;
let viewing = false;



// three.js functions
const main  = () => {
    const canvas = document.querySelector('#c');

    // renderer
    const renderer = new THREE.WebGLRenderer({canvas, antialias: true});
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // camera
    const camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 1, 15000 );
    camera.position.set( 0, 0, 2.5 );
    camera.target = new THREE.Vector3( 0, 0, 0 );


    // scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color( 0xffffff );
    scene.fog = new THREE.FogExp2( 0xffffff, 0.015 );

    // controls
    const controls = new OrbitControls( camera, renderer.domElement );


    

    // loaders
    const loadManager = new THREE.LoadingManager();
    const textureLoader = new THREE.TextureLoader(loadManager);

    const addPointLight = (shade, intense, parent, angle, far, distance) => {
        const color = shade;
        const intensity = intense;
        const light = new THREE.SpotLight(color, intensity);
        light.castShadow = true;
        light.position.set(0, 0, -120);
        light.target.position.set(0, 0, 0);
        light.penumbra = 1;
        light.angle = angle;
        light.far = far;
        light.distance = distance;
        parent.add(light);
        parent.add(light.target);
    }

    addPointLight(0xFFFFFF, 1, scene, 1, 4, 1000);

    scene.add( new THREE.AmbientLight( 0xffffff, 0.3 ) );

    // add anchor
    let anchor;

    {
        const width = 0;
        const height = 0;
        const material = new THREE.MeshBasicMaterial({color: 0xfff, transparent: true, opacity: 0});
        const geometry = new THREE.PlaneBufferGeometry(width, height);
        anchor = new THREE.Mesh(geometry, material);
        scene.add(anchor);
    }

    // add groud and ceiling plane

    let floor;
    let ceiling;
    {
        const width = 5;
        const depth = 100;
        const geometry = new THREE.PlaneBufferGeometry(width, depth);
        const texture = textureLoader.load(assets + 'walls_base.jpg');
        texture.magFilter = THREE.NearestFilter;
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        const repeats = depth / 10;
        texture.repeat.set(1, repeats);
        const material = new THREE.MeshPhongMaterial({color: 0xffffff, map: texture});
        
        floor = new THREE.Mesh(geometry, material);
        floor.rotation.x = -90 * Math.PI/180;
        floor.position.set(0, -6.68*2, -40);

        ceiling = new THREE.Mesh(geometry, material);
        ceiling.rotation.x = 90 * Math.PI/180;
        ceiling.position.set(0, 6.68*1, -40);
    }

    // add walls
    let sides = [];
    function walls (x, z, right, factor, name){
        const width = 10;
        const height = 6.68;
        const texture = textureLoader.load(assets + 'walls_base.jpg')
        const geometry = new THREE.PlaneBufferGeometry(width, height);
        const material = new THREE.MeshPhongMaterial({color: 0xFFFFFF, map: texture});

        const wall = new THREE.Mesh(geometry, material);
        wall.position.set(x, height * factor, z - width/2 + 10);

        if(right){
            wall.rotation.y = -90*Math.PI/180;
        } else {
            wall.rotation.y = 90*Math.PI/180;
        }
        wall.name = name;
        sides.push(wall);
    }

    for(let i = 0; i < 10; i++){
        walls(-2.5, i * -10, false, -1.5, i + '_l_a');
        walls(-2.5, i * -10, false, -0.5, i + '_l_a');
        walls(-2.5, i * -10, false, 0.5, i + '_l_c');
        walls(2.5, i * -10, true, -1.5, i + '_r_a');
        walls(2.5, i * -10, true, -0.5, i + '_r_a');
        walls(2.5, i * -10, true, 0.5, i + '_r_c');
    }

    console.log(sides);

    loadManager.onLoad = () => {
        anchor.add(floor);
        anchor.add(ceiling)
        
        loadingElem.style.display = 'none';
        sides.forEach(wall => {
            anchor.add(wall);
        })
        
        
    };

    loadManager.onProgress = (urlOfLastItemLoaded, itemsLoaded, itemsTotal) => {
        const progress = itemsLoaded / itemsTotal*100;
        progressBarElem.style.width = progress + '%';
    };


    
  class PickHelper {
    constructor() {
      this.raycaster = new THREE.Raycaster();
      this.raycaster.far = 300;
      this.pickedObject = null;
      this.pickedObjectSavedColor = 0;
    }
    pick(normalizedPosition, scene, camera) {
      // restore the color if there is a picked object
      if (this.pickedObject) {
        this.pickedObject = undefined;
      }

      // cast a ray through the frustum
      this.raycaster.setFromCamera(normalizedPosition, camera);
      // get the list of objects the ray intersected
      const intersectedObjects = this.raycaster.intersectObjects(anchor.children);
      if (intersectedObjects.length) {
        // pick the first object. It's the closest one
        this.pickedObject = intersectedObjects[0].object;
      }
    }
  }

  const pickPosition = {x: 0, y: 0};
  const pickHelper = new PickHelper();
  clearPickPosition();

    

    renderer.render( scene, camera );

    // resize function
    const onWindowResize = () => {

        windowHalfX = window.innerWidth / 2;
        windowHalfY = window.innerHeight / 2;
    
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
    
        renderer.setSize( window.innerWidth, window.innerHeight );
    
    }

    const render = () => {
        currentObject = undefined;
        let itemSelected = false;
        window.addEventListener('resize', onWindowResize, false);


        pickHelper.pick(pickPosition, scene, camera);
        
        if(pickHelper.pickedObject && !orbiting){
            if(pickHelper.pickedObject.name){
                currentObject = pickHelper.pickedObject;
                itemSelected = true;
                goldColor(pickHelper.pickedObject, true)
            }
        }

        sides.forEach(wall => {
            goldColor(wall, false);
        })
        
        renderer.setPixelRatio( window.devicePixelRatio );
        renderer.render(scene, camera);

        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);
    controls.update();


    function goldColor (object, bool) {
        let g = object.material.color.g;
        let b = object.material.color.b;
        if(bool){
            if(g > 0.7){g -= 0.05}
            if(b > 0){b -= 0.1}
        } else {
            if(g < 1){g += 0.01}
            if(b < 1){b += 0.01}
        }
        object.material.color.setRGB(1, g, b);
    }

    function getCanvasRelativePosition(event) {
		const rect = canvas.getBoundingClientRect();
		return {
		x: (event.clientX - rect.left) * canvas.width  / rect.width,
		y: (event.clientY - rect.top ) * canvas.height / rect.height,
		};
	}

	function setPickPosition(event) {
		const pos = getCanvasRelativePosition(event);
		pickPosition.x = (pos.x /  canvas.width ) *  2 - 1;
        pickPosition.y = (pos.y / canvas.height) * -2 + 1;  // note we flip Y
	}

	
    controls.addEventListener('change', () => {

        orbiting = true;

    });

	function clearPickPosition() {
		pickPosition.x = -100000;
		pickPosition.y = -100000;
  }
  

    window.addEventListener('mousemove', setPickPosition);
	window.addEventListener('mouseout', clearPickPosition);
    window.addEventListener('mouseleave', clearPickPosition);
    window.addEventListener('mouseup', () => {
        orbiting = false;
    })


	window.addEventListener('touchstart', (event) => {
		// prevent the window from scrolling
		event.preventDefault();
        setPickPosition(event.touches[0]);
        checkForClick();
	}, {passive: false});

	window.addEventListener('touchmove', (event) => {
        setPickPosition(event.touches[0]);
        checkForClick();
	});

	window.addEventListener('touchend', () => {
        clearPickPosition();
        orbiting = false;
        checkForClick();
	})
}


// event listeners
beginBtn.addEventListener('click', () => {
    overlay.style.display = 'none';
    threeJsWindow.style.display = 'block';
    main();
});

beginBtn.addEventListener('touchend', () => {
    overlay.style.display = 'none';
    threeJsWindow.style.display = 'block';
    main();
});


// functions
window.addEventListener('mouseup', () => {
    checkForClick();
});

const checkForClick = () => {
    if(!orbiting && !viewing && currentObject){
    }
    currentObject = undefined;
}
