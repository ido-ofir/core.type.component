
function propTypesToArray(target){
    if(!target) return [];
    if(Array.isArray(target)) return target;
    var type;
    var result = [];
    for(var key in target){
        if(typeof target[key] === 'string'){
            result.push({ key: key, type: target[key] });
        }
        else{
            result.push(Object.assign({ key: key }, target[key]));
        }
    }
    return result;
}

function propTypesObject(propTypesArray, ReactPropTypes) {
    if (!propTypesArray) return {};
    var PropType;
    var pt = {};
    propTypesArray.map(item => {
        if(!item.type) return;
        PropType = ReactPropTypes[item.type];
        if (!PropType) return console.warn(`cannot find PropType ${item.type}`);
        if (item.isRequired) {
            pt[item.key] = PropType.isRequired;
        } else {
            pt[item.key] = PropType;
        }
    });
    return pt;
}

function getDefaultPropsFunction(propTypesArray){
    var defaultProps = propTypesArray.reduce((result, item) => {
        result[item.key] = item.value;
        return result;
    }, {});
    return () => { return defaultProps; };
}


module.exports = {
    name: 'core.type.component',
    dependencies: [
        'core.plugin.get-definition-object',
        'core.plugin.build',
        'core.import.react',
        'core.import.create-react-class',
        'core.import.prop-types',
    ],
    types: [{
        name: 'component',
        extends: 'module',
        build(definition, _super, done) {
            
            var core = this;
            var { get, name, value, propTypes } = definition;
            var propTypesArray = propTypesToArray(propTypes);
            var def = core.assign({}, definition, {
                get(modules){
                    var component, def = value ? value : get.apply(this, arguments);
                    if(core.isFunction(def)){
                        component = def;
                    }
                    else{
                        if(propTypesArray){
                            def.propTypes = def.propTypes || propTypesObject(propTypesArray, core.imports.PropTypes);
                            def.getDefaultProps = def.getDefaultProps || getDefaultPropsFunction(propTypesArray);
                        }
                        component = core.createComponent(name, def);
                    }
                    core.components[name] = component;
                    return component;
                }
            });
            
            delete def.value;
            _super(def, done);
        }
    }],
    extend: {
        components: {},
        Component(name, dependencies, get, done) {
            var definition = this.getDefinitionObject(name, dependencies, get, 'component', done);            
            return this.build(definition, definition.done);
        },
        createElement(definition) {

            if(!this.isObject(definition)){ return definition; }
            
            var {
                type,
                props,
                children
            } = definition;

            var {
                React
            } = this.imports;

            var component = this.components[type] || type;
            if (children) {
                children = children.map(child => this.createElement(child));
                children.unshift(props);
                children.unshift(component);
                return React.createElement.apply(React, children);
            }
            return React.createElement(component, props);
        },
        createComponent(name, componentDefinition) {
            var core = this;
            var { createReactClass, React } = core.imports;
            var component;
            if (core.isFunction(componentDefinition)) { // stateless component function
                component = componentDefinition;
            } else if (core.isFunction(componentDefinition.value)) { // stateless component function
                component = componentDefinition.value;
            } else {
                // componentDefinition.propTypes = getReactPropTypes(componentDefinition.propTypes, this.PropTypes);
                component = createReactClass(componentDefinition);
                component.displayName = name;
                if (componentDefinition.enhancers) { // enhancers is an array of higher order constructors.
                    componentDefinition.enhancers.map((higherOrder) => {
                        component = higherOrder(component);
                    });
                }
            }
            return component;
        },
    }
};