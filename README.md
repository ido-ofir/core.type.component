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
        return {
            render(){
                return <div>OK</div>
            }
        }
    }
});

// available on core.components
core.components.SomeComponent

// can also be required
core.require(['SomeComponent'], (SomeComponent) => { ... })
```
