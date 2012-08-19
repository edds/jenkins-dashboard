if(typeof window.jenkinsDash === 'undefined') window.jenkinsDash = {};

(function(jenkinsDash){
  var manager = {};
  manager.view = 'All';

  manager.update = function(data){
    var job, i, _i, j, _j,
        newProjects = false,
        visibleProjects = [];

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

    manager.showAlert('failure', failed);
    manager.showAlert('unstable', unstable);

    jenkinsDash.Project.syncVisible(visibleProjects);
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

  manager.fetch = function(url, fn){
    var callback = 'callback' + Math.round(Math.random()*10000),
        script = document.getElementById('jsonp'),
        lastScript;

    window[callback] = (function(callback, fn){
      return function(data){
        fn(data);
        delete window[callback];
        script = document.getElementById('jsonp'),
        script.parentNode.removeChild(script);
      };
    }(callback, fn));

    if(!script){
      script = document.createElement('script');
      script.setAttribute('id', 'jsonp');
      lastScript = document.getElementsByTagName('script')[0];
      lastScript.parentNode.insertBefore(script,lastScript)
    }

    script.setAttribute('src', url + callback);
  };

  manager.timer = function(duration){
    var loader = document.getElementById("refresh-timer"),
        end = +new Date() + duration,
        radius = 12,
        interval;

    interval = window.setInterval(function(){
      if(+new Date() > end){
        window.clearInterval(interval);
        return true;
      }
      var degrees = 360 - 360*((end - new Date())/duration),
          y = -Math.cos((degrees/180)*Math.PI)*radius,
          x = Math.sin((degrees/180)*Math.PI)*radius,
          mid = (degrees < 180) ? '0,1' : '1,1',
          d = "M"+radius+","+radius+" v -"+radius+" A"+radius+","+radius+" 1 "+mid+" " + (x+radius) + "," + (y+radius) + " z";
      loader.setAttribute("d", d);
    }, 50);
  };

  manager.login = function(user, pass){
    var iframe = document.createElement('iframe'),
        script = document.getElementsByTagName('script')[0];

    script.parentNode.insertBefore(iframe, script);
    iframe.contentDocument.body.innerHTML = '<form action="'+ jenkinsDash.settings.host +'/j_acegi_security_check" method="post">'
        + '<input type="hidden" name="j_username" value="'+ jenkinsDash.settings.user +'">'
        + '<input type="hidden" name="j_password" value="'+ jenkinsDash.settings.pass +'">'
        + '<input type="hidden" name="from" value="/api">'
      + '</form>';
    iframe.contentDocument.getElementsByTagName('form')[0].submit();
    window.setTimeout(function(){
      iframe.parentNode.removeChild(iframe);
    }, 10000);
  };
  manager.start = function(){
    manager.interval = window.setInterval(function(){
      var updateUrl = jenkinsDash.settings.host + '/api/json?tree=views[name,jobs[name,lastCompletedBuild[result,duration,timestamp],lastBuild[result],healthReport[description,score],inQueue,buildable,color]]&jsonp=';
      manager.fetch(updateUrl, manager.update);
      manager.timer(5e3);
    }, 5e3);
  };
  manager.stop = function(){
    window.clearInterval(manager.interval);
  };

  manager.login();
  manager.start();

  jenkinsDash.manager = manager;
}(jenkinsDash));

