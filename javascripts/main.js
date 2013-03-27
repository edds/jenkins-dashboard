if(typeof window.jenkinsDash === 'undefined') window.jenkinsDash = {};

(function(jenkinsDash){
  var manager = {};
  manager.callbackCount = 0;

  manager.update = function(data, settings){
    var job, i, _i, j, _j,
        projectCount = jenkinsDash.Project.count();

    for(i=0, _i=data.views.length; i<_i; i++){
      if(data.views[i].name === settings.view){
        for(j=0, _j=data.views[i].jobs.length; j<_j; j++){
          job = jenkinsDash.Project.find(settings, data.views[i].jobs[j]);
          if(job === false){
            job = new jenkinsDash.Project(settings, data.views[i].jobs[j]);
          } else {
            job.update(data.views[i].jobs[j]);
          }
        }
      }
    }
    if(jenkinsDash.Project.count() !== projectCount){
      manager.redraw();
    }
    manager.refresh();
  };
  manager.refresh = function(){
    var failed = jenkinsDash.Project.findByStatus('failure'),
        unstable = jenkinsDash.Project.findByStatus('unstable');

    manager.showAlert('failure', failed);
    manager.showAlert('unstable', unstable);
  };
  manager.showAlert = function(type, projects){
    var alert = jenkinsDash.Project.findByStatus(type),
        unstable = jenkinsDash.Project.findByStatus('unstable'),
        alertEl = document.querySelectorAll('.'+type)[0];
        names = alertEl.querySelectorAll('.project-names')[0];

    if(projects.length){
      names.innerHTML = projects.map(function(job){ return job.name; }).join(', ');
      alertEl.style.display = "block";
    } else {
      alertEl.style.display = "none";
    }
  };

  manager.redraw = function(){
    var projects = jenkinsDash.Project.all(),
        i, _i, list,
        html = [];

    for(i=0,_i=projects.length; i<_i; i++){
      html.push(projects[i].render());
    }
    list = document.querySelectorAll('.project-list')[0];
    list.innerHTML = html.join('');
  };

  manager.fetch = function(){
    jenkinsDash.settings.forEach(function(settings){
      var auth = btoa(settings.user +':'+ settings.pass),
          url = settings.host + '/api/json?tree=views[name,jobs[name,lastCompletedBuild[result,duration,timestamp],lastBuild[result,timestamp],lastSuccessfulBuild[duration],healthReport[description,score],inQueue,buildable,color]]',
          request = new XMLHttpRequest();

      request.onreadystatechange = function(){
        if (request.readyState === 4) {
          if(request.status === 200){
            manager.update(JSON.parse(request.responseText), settings);
            manager.createInterval();
          } else {
            manager.createInterval(false);
          }
        }
      }
      request.ontimeout = function(){
        manager.createInterval(false);
      }
      request.onerror = function(){
        manager.createInterval(false);
      }

      request.open('GET', url);
      request.setRequestHeader('Authorization', 'Basic '+ auth)
      request.timeout = 5e3;
      request.send();
    });
  };

  manager.createInterval = function(success){
    manager.callbackCount = manager.callbackCount + 1;
    if(manager.callbackCount === jenkinsDash.settings.length){
      manager.callbackCount = 0;
      if(typeof success === 'undefined' || success){
        manager.timer(5e3);
      }
      manager.interval = window.setTimeout(manager.fetch, 5e3);
    }
  },
  manager.timer = function(duration){
    var loader = document.getElementById("refresh-timer"),
        end = Date.now() + duration,
        radius = 12,
        interval;

    interval = window.setInterval(function(){
      if(Date.now() > end){
        window.clearInterval(interval);
        return true;
      }
      var degrees = 360 - 360*((end - Date.now())/duration),
          y = -Math.cos((degrees/180)*Math.PI)*radius,
          x = Math.sin((degrees/180)*Math.PI)*radius,
          mid = (degrees < 180) ? '0,1' : '1,1',
          d = "M"+radius+","+radius+" v -"+radius+" A"+radius+","+radius+" 1 "+mid+" " + (x+radius) + "," + (y+radius) + " z";
      loader.setAttribute("d", d);
    }, 50);
  };

  manager.start = function(){
    manager.fetch();
  };
  manager.stop = function(){
    window.clearTimeout(manager.interval);
  };

  manager.start();

  jenkinsDash.manager = manager;
}(jenkinsDash));

