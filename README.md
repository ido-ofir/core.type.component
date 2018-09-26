# core.type.component

a react component

```js
let core = new require('core.constructor')();
 
core.plugin(
   require('core.type.component')
);
 
// define an action using core.Action method
core.Component({
    name: 'SomeComponent',
    dependencies: ['moduleA', 'moduleB'],
    get(moduleA, moduleB){
    
        // return a React component definition
        return {
            componentDidMount(){ ... },
            render(){
                return <div>OK</div>
            }
        }
    }
});

// can be required
core.require(['SomeComponent'], (SomeComponent) => { ... })

// once loaded, also available on core.components
core.components.SomeComponent
```
