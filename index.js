
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

function getPropType(type, ReactPropTypes, coreTypes){
    var propType = ReactPropTypes[type];
    if(!propType && coreTypes[type] && coreTypes[type].extends){
        propType = getPropType(coreTypes[type].extends, ReactPropTypes, coreTypes);
    }
    return propType;
}

function propTypesObject(propTypesArray, ReactPropTypes, coreTypes) {
    if (!propTypesArray) return {};
    var PropType;
    var pt = {};
    propTypesArray.map(item => {
        if(!item.type) return;
        PropType = getPropType(item.type, ReactPropTypes, coreTypes);
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
    channels: ['core.component.definition', 'core.component.loaded'],
    dependencies: [
        'core.plugin.type',
        'core.loader.types',
        'core.import.react',
        'core.import.create-react-class',
        'core.import.prop-types',
    ],
    types: [{
        name: 'component',
        extends: 'module',
        identifier: 'name',
        schema: [
            {
                key: 'schema',
                type: 'array',
                params: { ofType: 'schemaItem' },
                description: 'A schema that describes the props that this component will accept',
                defaultValue: []
            }
        ],
        build(definition, done) {
            
            var core = this;
            var { get, name, value, dependencies, schema } = definition;
            var propTypesArray = propTypesToArray(schema);

            core.Module(name, dependencies, function(modules){

                var component, def = value ? value : get.apply(this, arguments);
                if(core.isFunction(def)){
                    component = def;
                }
                else{
                    if(propTypesArray){
                        def.propTypes = def.propTypes || propTypesObject(propTypesArray, core.imports.PropTypes, core.types);
                        def.getDefaultProps = def.getDefaultProps || getDefaultPropsFunction(propTypesArray);
                    }
                    core.fire('core.component.definition', def, (defin) => {
                        def = defin;
                    })
                    component = core.createComponent(name, def);
                }
                core.fire('core.component.loaded', component, (comp) => {
                    component = comp;
                })
                return component;

            }, function(component){

                core.components[name] = component;
                done && done(component);

            });
        }
    }],
    extend: {
        components: {},
        Component(name, dependencies, get, done) {
            if(Array.isArray(name)){
                return name.map(this.Component)
            }
            var definition = this.type.getDefinitionObject(name, dependencies, get, 'component', done);
            // return this.build(definition, definition.done);
            var source = this.type.toSource({
                id: definition.name,
                key: definition.name,
                type: 'component',
                description: definition.description || '',
              }, definition);
              
            return this.build(source, definition.done);
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
                component.displayName = componentDefinition.displayName || name;
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