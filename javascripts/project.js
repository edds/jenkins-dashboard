if(typeof window.jenkinsDash === 'undefined') window.jenkinsDash = {};

(function(jenkinsDash){
  var projects = [],
      projectsByName = {},
      Project = function(options){
        this.id = getId(options.name);
        this.name = options.name;
        this.hiding = false;

        this.original = options;
        register(this);
      };

  // Instance Methods
  Project.prototype = {
    getStatus: function(){
      if(!this.original.buildable || this.original.color === 'grey'){
        return 'disabled';
      }
      if(this.original.lastCompletedBuild){
        return this.original.lastCompletedBuild.result.toLowerCase();
      }
      return 'unknown';
    },
    getHealth: function(){
      var i, _i, report;
      for(i=0,_i=this.original.healthReport.length; i<_i; i++){
        report = this.original.healthReport[i];
        if(report.description.substr(0, 15) === 'Build stability'){
          return report.score;
        }
      }
      return '-';
    },
    getLastBuildTime: function(){
      var lastBuild = this.original.lastCompletedBuild;

      if(lastBuild){
        return lastBuild.timestamp+lastBuild.duration;
      } else {
        return false;
      }
    },
    getTimeSinceLastBuild: function(){
      var lastBuild = this.getLastBuildTime();

      if(lastBuild){
        return timeSince(lastBuild);
      } else {
        return '-';
      }
    },
    getQueueClass: function(){
      var className = [];
      if(this.original.inQueue){
        className.push('queued');
      }
      if(this.original.color.split('_')[1] === 'anime'){
        className.push('building');
      }
      return className.join(' ');
    },
    getQueue: function(){
      if(this.original.lastBuild === null){
        return 'Building';
      }
      if(this.original.inQueue){
        return 'Queued';
      }
      return '&nbsp;';
    },
    getClass: function(){
      return 'project '+ this.getStatus() +' '+ this.getQueueClass()
            + (this.hiding ? ' hidden' : '');
    },
    render: function(){
      return '<p id="'+ this.id +'" class="'+ this.getClass() +'">'
              + '<span class="built">'+ this.getTimeSinceLastBuild() +'</span>'
              + '<span class="name">'+ this.name +'</span>'
            + '</p>';
    },
    update: function(data){
      if(data){
        this.original = data;
      }
      var el = document.getElementById(this.id);
      if(el){
        el.setAttribute('class', this.getClass());
        el.getElementsByClassName('built')[0].innerHTML = this.getTimeSinceLastBuild()
      }
    },
    show: function(){
      this.hiding = false;
      this.update();
    },
    hide: function(){
      this.hiding = true;
      this.update();
    }
  };

  // Class Methods
  Project.all = function(){
    return projects.sort(function(a,b){
      return a.name.toUpperCase() > b.name.toUpperCase() ? 1 : -1;
    });
  };
  Project.count = function(){
    return projects.length;
  }
  Project.find = function(obj){
    var name = typeof obj === 'object' ? obj.name : obj;
    if(typeof projectsByName[name] !== 'undefined'){
      return projectsByName[name];
    }
    return false;
  };
  Project.findByStatus = function(status){
    var i, _i, out = [];
    for(i=0,_i=projects.length; i<_i; i++){
      if(projects[i].getStatus() === status){
        out.push(projects[i]);
      }
    }
    return out;
  };
  Project.findByLastUpdate = function(date){
    var i, _i, out = [];
    for(i=0,_i=projects.length; i<_i; i++){
      if(projects[i].getLastBuildTime() > date){
        out.push(projects[i]);
      }
    }
    return out;
  };
  Project.syncVisible = function(visible){
    var visibleIds = visible.map(function(p){ return p.id; });
    projects.forEach(function(project){
      if(visibleIds.indexOf(project.id) > -1){
        project.show();
      } else {
        project.hide();
      }
    });
  };



  // Helper Methods
  function register(obj){
    projects.push(obj);
    projectsByName[obj.name] = obj;
  }
  function getId(name){
    var id = name.replace(/\s+/g, '-').toLowerCase();
    if(typeof projects[id] !== 'undefined'){
      return getId(name + '-');
    } else {
      return id;
    }
  }
  function timeSince(date){
    var seconds = (+new Date() - date) / 1000;
    var interval = Math.floor(seconds / 31536000);
    if (interval > 1) {
      return interval + " yrs";
    }
    interval = Math.floor(seconds / 2592000);
    if (interval > 1) {
      return interval + " mth";
    }
    interval = Math.floor(seconds / 86400);
    if (interval > 1) {
      return interval + " day";
    }
    interval = Math.floor(seconds / 3600);
    if (interval >= 1) {
      return interval + " hrs";
    }
    interval = Math.floor(seconds / 60);
    if (interval >= 1) {
      return interval + " min";
    }
    return Math.floor(seconds) + " sec";
  }

  jenkinsDash.Project = Project;
}(window.jenkinsDash));
