if(typeof window.jenkinsDash === 'undefined') window.jenkinsDash = {};

(function(jenkinsDash){
  var manager = {};
  manager.view = jenkinsDash.settings.view || 'All';

  manager.update = function(data){
    var job, i, _i, j, _j,
        newProjects = false,
        visibleProjects = [];

    if(data.views.length === 0){
      manager.stop();
      window.setTimeout(function(){
        manager.login();
        manager.start();
      }, 10e3);
    }

    for(i=0, _i=data.views.length; i<_i; i++){
      for(j=0, _j=data.views[i].jobs.length; j<_j; j++){
        job = jenkinsDash.Project.find(data.views[i].jobs[j]);
        if(job === false){
          job = new jenkinsDash.Project(data.views[i].jobs[j]);
          newProjects = true;
        } else {
          job.update(data.views[i].jobs[j]);
        }
        if(data.views[i].name === manager.view){
          visibleProjects.push(job);
        }
      }
    }
    if(newProjects){
      manager.redraw();
    }
    manager.refresh(visibleProjects);
  };
  manager.refresh = function(visibleProjects){
    var failed = jenkinsDash.Project.findByStatus('failure'),
        unstable = jenkinsDash.Project.findByStatus('unstable');

    jenkinsDash.Project.syncVisible(visibleProjects);

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
    var auth = btoa(jenkinsDash.settings.user +':'+ jenkinsDash.settings.pass),
        url = jenkinsDash.settings.host + '/api/json?tree=views[name,jobs[name,lastCompletedBuild[result,duration,timestamp],lastBuild[result,timestamp],healthReport[description,score],inQueue,buildable,color]]',
        request = new XMLHttpRequest();

    request.onreadystatechange = function(){
      if (request.readyState === 4 && request.status === 200) {
        manager.update(JSON.parse(request.responseText));
        manager.timer(5e3);
        manager.interval = window.setTimeout(manager.fetch, 5e3);
      }
    }

    request.open('GET', url);
    request.setRequestHeader('Authorization', 'Basic '+ btoa('ccdash:_ccdash_'))
    request.send();
  };

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

