const onRendererReady = async () => {
  const electron = window.electron;
  const projectList = document.querySelector('[data-project-list]');
  const taskList = document.querySelector('[data-task-list]');
  const runningTasksList = document.querySelector('[data-running-tasks-list]');
  const runningTasksContainer = document.querySelector('[data-running-tasks-container]');
  const runningTasksEmptyInfo = document.querySelector('[data-running-tasks-empty-info]');
  const projectActionsContainer = document.querySelector('[data-project-actions-container]');
  const taskActionsContainer = document.querySelector('[data-task-actions-container]');
  const editProjectModal = document.getElementById('edit-project-modal');
  const editProjectModalButtons = editProjectModal.querySelector('[data-buttons]');
  const editTaskModal = document.getElementById('edit-task-modal');
  const editTaskDefModal = document.getElementById('edit-taskdef-modal');
  const editTaskModalButtons = editTaskModal.querySelector('[data-buttons]')
  const deleteProjectModal = document.querySelector('#delete-project-modal');
  const deleteProjectModalButtons = deleteProjectModal.querySelector('[data-buttons]');
  const deleteTaskModal = document.getElementById('delete-task-modal');
  const deleteTaskDefModal = document.getElementById('delete-taskdef-modal');
  const deleteTaskDefModalButtons = deleteTaskDefModal.querySelector('[data-buttons]');
  const deleteTaskModalButtons = deleteTaskModal.querySelector('[data-buttons]');
  const projectButtons = projectActionsContainer.querySelector('[data-buttons]');
  const taskButtons = taskActionsContainer.querySelector('[data-buttons]');
  const addTaskForm = document.querySelector('[data-task-form]');
  const editProjectForm = editProjectModal.querySelector('form');
  const editTaskForm = editTaskModal.querySelector('form');
  const addProjectForm = document.querySelector('[data-project-form]');
  const taskDefSection = document.querySelector('[data-taskdef-section]');
  const addTaskDefForm = document.querySelector('[data-add-taskdef-form]');
  const taskDefList = document.querySelector('[data-taskdef-list]');
  const taskDefActionsContainer = document.querySelector('[data-taskdef-actions-container]');
  const taskDefButtons = taskDefActionsContainer.querySelector('[data-buttons]');
  const taskDefTemplate = taskDefList.querySelector('[data-taskdef-item]').cloneNode(true);
  taskDefList.querySelector('[data-taskdef-item]').remove();

  let projects = [];
  let projectTemplate = null;
  let taskTemplate = null;
  let selectedProject = null;
  let selectedTask = null;
  let selectedTaskDef = null;

  runningTasksList.classList.add('is-hidden');
  runningTasksEmptyInfo.classList.remove('is-hidden');

  const convertSecondsToTime = (s) => {
    const hours = String(Math.floor(s / 3600));
    const minutes = String(Math.floor((s % 3600) / 60));
    const seconds = String(s % 60);
    return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:${seconds.padStart(2, '0')}`;
  }

  const convertTimeToSeconds = (hours, minutes, seconds) => {
    return (parseInt(hours, 10) * 3600) + (parseInt(minutes, 10) * 60) + parseInt(seconds, 10);
  }

  const showToast = (opts) => {
    opts.type = opts.type || 'info';
    opts.timeout = opts.timeout * 1000 || 3000;
    const tpl = `<article class="message is-${opts.type}"><div class="message-header"><p>${opts.title}</p></div><div class="message-body">${opts.content}</div></article>`
    const container = document.createElement('div')
    container.classList.add('toast')
    container.innerHTML = tpl
    document.body.appendChild(container)
    setTimeout(() => {
      container.remove()
    }, opts.timeout)
  }

  const loadRunningTasks = async () => {
    const tasks = await electron.getRunningTasks()
    if (tasks.length === 0) {
      runningTasksList.classList.add('is-hidden');
      runningTasksContainer.classList.add('is-hidden');
      runningTasksEmptyInfo.classList.remove('is-hidden');
      return;
    }
    runningTasksContainer.classList.remove('is-hidden');
    runningTasksList.classList.remove('is-hidden');
    runningTasksEmptyInfo.classList.add('is-hidden');
    runningTasksList.innerHTML = '';
    tasks.forEach(task => {
      const taskItemRoot = document.createElement('tr');
      taskItemRoot.dataset.name = task.name;
      taskItemRoot.dataset.projectName = task.projectName;
      taskItemRoot.dataset.date = task.date;
      taskItemRoot.dataset.seconds = task.seconds;
      taskItemRoot.getTime = () => {
        return convertSecondsToTime(taskItemRoot.dataset.seconds)
      }
      taskItemRoot.tickfunc = () => {
        taskItemRoot.dataset.seconds = parseInt(taskItemRoot.dataset.seconds, 10) + 1;
        const t = taskItemRoot.querySelectorAll('td');
        const time = taskItemRoot.getTime()
        if (task.projectName !== t[0].innerHTML) t[0].innerHTML = task.projectName
        if (task.name !== t[1].innerHTML) t[1].innerHTML = task.name
        if (time !== t[1].innerHTML) t[2].innerHTML = time
      };
      if (task.isRunning) {
        taskItemRoot.dataset.tick = setInterval(taskItemRoot.tickfunc, 1000);
        taskItemRoot.innerHTML = `<td></td><td></td><td></td><td>${task.date}</td><td>
<button class="button is-warning" data-button-action="toggle">Pause</button>
</td>`;
      } else {
        taskItemRoot.innerHTML = `<td></td><td></td><td></td><td>${task.date}</td><td>
<button class="button is-primary" data-button-action="toggle">Resume</button>
</td>`;
      }
      taskItemRoot.tickfunc()
      runningTasksList.appendChild(taskItemRoot);
    })
  }

  runningTasksList.addEventListener('click', async (evt) => {
    evt.preventDefault();
    const target = evt.target;
    if (!target.dataset.buttonAction) return;
    let taskRoot;
    let btn;
    let res;
    switch(target.dataset.buttonAction) {
      case 'toggle':
        taskRoot = target.closest('tr');
        if (taskRoot.dataset.tick) {
          clearInterval(taskRoot.dataset.tick);
          taskRoot.removeAttribute('data-tick');
          btn = taskRoot.querySelector('button');
          btn.innerHTML = 'Resume';
          btn.classList.remove('is-warning')
          btn.classList.add('is-primary')
          res = await electron.stopRunningTask({
            name: taskRoot.dataset.name,
            projectName: taskRoot.dataset.projectName,
            date: taskRoot.dataset.date
          })
        } else {
          taskRoot.dataset.tick = setInterval(taskRoot.tickfunc, 1000);
          btn = taskRoot.querySelector('button');
          btn.innerHTML = 'Pause';
          btn.classList.remove('is-primary')
          btn.classList.add('is-warning')
          res = await electron.startRunningTask({
            name: taskRoot.dataset.name,
            projectName: taskRoot.dataset.projectName,
            date: taskRoot.dataset.date
          })
        }
        break;
      default:
        break;
    }
  });

  loadRunningTasks();

  const toggleTask = async () => {
    if (!selectedTask) {
      return;
    }
    let maybe = await electron.getRunningTask({name: selectedTask.dataset.name, projectName: selectedProject.dataset.name, date: selectedTask.dataset.date})
    if (maybe && maybe.success) {
      runningTasksList.querySelectorAll('tbody tr').forEach((taskRoot) => {
        if (taskRoot.tick) {
          clearInterval(taskRoot.tick);
        } else {
          setInterval(taskRoot.tickfunc, 1000);
        }
      })
    } else {
      maybe = await electron.addRunningTask({name: selectedTask.dataset.name, projectName: selectedProject.dataset.name, date: selectedTask.dataset.date, seconds: selectedTask.dataset.seconds})
      if (maybe && maybe.success) {
        await loadRunningTasks()
      } else {
        showToast({ title: 'Error', content: 'Task could not be toggled', type: 'danger' })
      }
    }
  }


  const deleteProject = async (projectNode) => {
    if (!projectNode) {
      return;
    }
    const projectName = projectNode.innerText;
    const res = await electron.deleteProject(projectName)
    if (res.success) {
      projectNode.remove()
      projectActionsContainer.classList.add('is-hidden');
    }
  }

  const deleteTask = async (taskNode) => {
    if (!taskNode) {
      return;
    }
    const projectName = selectedProject.dataset.name;
    const name = taskNode.dataset.name;
    const date = taskNode.dataset.date;
    const res = await electron.deleteTask({name, date, projectName})
    if (res.success) {
      taskNode.remove()
      projectActionsContainer.classList.add('is-hidden');
    }
  }

  const deleteTaskDefinition = async (taskDefNode) => {
    if (!taskDefNode) {
      return;
    }
    const projectName = selectedProject.dataset.name;
    const name = taskDefNode.dataset.name;
    const res = await electron.deleteTaskDefinition({name, projectName})
    if (res.success) {
      taskDefNode.remove()
      taskDefActionsContainer.classList.add('is-hidden');
    }
  }

  const projectListToggleActiveItem = (item) => {
    projectList.querySelectorAll('[data-project-item]').forEach(i => {
      i.classList.remove('is-active');
    });
    item.classList.add('is-active');
  }

  const onTaskDefItemClick = (taskItem) => {
    taskDefListToggleActiveItem(taskItem);
    taskDefActionsContainer.classList.remove('is-hidden');
    selectedTaskDef = taskItem;
  }

  const loadTaskDefList = async () => {
    taskActionsContainer.classList.add('is-hidden');
    const taskDefs = await electron.getTaskDefinitions(selectedProject.dataset.name);
    taskDefList.innerHTML = '';
    taskDefs.forEach(taskDef => {
      const taskDefItem = taskDefTemplate.cloneNode(true);
      taskDefItem.addEventListener('click', onTaskDefItemClick.bind(null, taskDefItem));
      taskDefItem.querySelector('[data-taskdef-name]').innerHTML = taskDef.name;
      taskDefItem.dataset.name = taskDef.name;
      taskDefList.appendChild(taskDefItem);
    })
  }

  const onProjectItemClick = async (projectItem) => {
    selectedProject = projectItem;
    projectListToggleActiveItem(projectItem);
    const pn = projectItem.querySelector('[data-project-item-header]').innerHTML
    selectedProject.dataset.name = pn;
    loadTaskList();
    loadTaskSelectbox();
    loadTaskDefList();
    projectActionsContainer.classList.remove('is-hidden');
    taskDefSection.classList.remove('is-hidden');
  }

  const loadProjectList = async () => {
    projects = await electron.getProjects();
    if (projectTemplate === null) {
      projectTemplate = document.querySelector('[data-project-item]').cloneNode(true);
      document.querySelector('[data-project-item]').remove();
    }
    projects.forEach(project => {
      const projectItem = projectTemplate.cloneNode(true);
      projectItem.addEventListener('click', onProjectItemClick.bind(null, projectItem));
      projectItem.querySelector('[data-project-item-header]').innerHTML = project.name;
      projectList.appendChild(projectItem);
    })
  }

  const taskListToggleActiveItem = (item) => {
    projectList.querySelectorAll('[data-task-item]').forEach(i => {
      i.classList.remove('is-active');
    });
    item.classList.add('is-active');
  }

  const taskDefListToggleActiveItem = (item) => {
    taskDefList.querySelectorAll('[data-taskdef-item]').forEach(i => {
      i.classList.remove('is-active');
    });
    item.classList.add('is-active');
  }

  const loadTaskList = async () => {
    taskList.classList.remove('is-hidden');
    const tasks = await electron.getTasks(selectedProject.dataset.name);
    if (taskTemplate === null) {
      taskTemplate = document.querySelector('[data-task-item]').cloneNode(true);
      document.querySelector('[data-task-item]').remove();
    }
    taskList.innerHTML = '';
    tasks.forEach(task => {
      const taskItem = taskTemplate.cloneNode(true);
      taskItem.addEventListener('click', async () => {
        selectedTask = taskItem;
        taskListToggleActiveItem(taskItem);
        taskActionsContainer.classList.remove('is-hidden');
      });
      taskItem.querySelector('[data-task-name').innerHTML = task.name;
      taskItem.querySelector('[data-task-time').innerHTML = convertSecondsToTime(task.seconds);
      taskItem.querySelector('[data-task-date').innerHTML = task.date;
      taskItem.dataset.name = task.name;
      taskItem.dataset.description = task.description;
      taskItem.dataset.date = task.date;
      taskItem.dataset.seconds = task.seconds;
      taskList.appendChild(taskItem);
    })
  }
  await loadProjectList();

  addProjectForm.addEventListener('submit', async (evt) => {
    evt.preventDefault();
    const form = evt.target;
    const name = form.querySelector('[data-project-name]').value
    const res = await electron.addProject(name)
    if (res.success) {
      const projectItem = projectTemplate.cloneNode(true);
      projectItem.addEventListener('click', onProjectItemClick.bind(null, projectItem));
      projectItem.querySelector('[data-project-item-header]').innerHTML = name;
      projectList.appendChild(projectItem);
    }
  });

  editProjectForm.addEventListener('submit', async (evt) => {
    evt.preventDefault();
    const form = evt.target;
    const oldname = form.querySelector('[data-project-oldname]').value
    const name = form.querySelector('[data-project-name]').value
    const res = await electron.editProject({name, oldname})
    if (res.success) {
      projectList.querySelectorAll('[data-project-item]').forEach((n) => {
        if (n.querySelector('[data-project-item-header]').innerHTML === oldname) {
          n.querySelector('[data-project-item-header]').innerHTML = name
        }
      })
      closeModal(form.closest('.modal'))
    }
  });

  editTaskForm.addEventListener('submit', async (evt) => {
    evt.preventDefault();
    const form = evt.target;
    const activeTask = taskList.querySelector('[data-task-item].is-active')
    const oldname = form.querySelector('[data-task-oldname]').value
    const name = form.querySelector('[data-task-name]').value
    const description = form.querySelector('[data-task-description]').value
    const seconds = form.querySelector('[data-task-seconds]').value
    const projectName = projectList.querySelector('[data-project-item].is-active').innerText;
    const date = activeTask.dataset.date;
    const res = await electron.editTask({name, oldname, description, seconds, date, projectName})
    if (res.success) {
      taskList.querySelectorAll('[data-task-item]').forEach((n) => {
        if (n.querySelector('[data-task-name]').innerHTML === oldname) {
          n.dataset.name = name
          n.dataset.description = description
          n.dataset.seconds = seconds
          n.dataset.date = date
          n.querySelector('[data-task-name]').innerHTML = name
          n.querySelector('[data-task-time]').innerHTML = convertSecondsToTime(seconds)
        }
      })
      closeModal(form.closest('.modal'))
    }
  });

  const loadTaskSelectbox = async () => {
    const taskSelectbox = addTaskForm.querySelector('select');
    const tasks = await electron.getTaskDefinitions(selectedProject.dataset.name);
    taskSelectbox.innerHTML = '';
    tasks.forEach(task => {
      const option = document.createElement('option');
      option.value = task.name;
      option.innerHTML = task.name;
      taskSelectbox.appendChild(option);
    })
  }

  const onTaskItemClick = (taskItem) => {
    selectedTask = taskItem;
    taskListToggleActiveItem(taskItem);
    taskActionsContainer.classList.remove('is-hidden');
  }

  addTaskForm.addEventListener('submit', async (evt) => {
    evt.preventDefault();
    const form = evt.target;
    const formData = new FormData(form);
    const name = formData.get('name');
    const description = formData.get('description');
    const seconds = formData.get('seconds');
    const projectName = selectedProject.dataset.name;
    const res = await electron.addTask({name, description, seconds, projectName})
    if (res.success) {
      const taskItem = taskTemplate.cloneNode(true);
      taskItem.dataset.name = name;
      taskItem.dataset.description = description;
      taskItem.dataset.seconds = seconds;
      taskItem.dataset.date = new Date().toISOString().split('T')[0];
      taskItem.addEventListener('click', onTaskItemClick.bind(null, taskItem));
      taskItem.querySelector('[data-task-name]').innerHTML = name;
      taskItem.querySelector('[data-task-seconds]').innerHTML = seconds;
      taskItem.querySelector('[data-task-date]').innerHTML = taskItem.dataset.date;
      taskList.appendChild(taskItem);
    }
  });

  editTaskDefModal.querySelector('form').addEventListener('submit', async (evt) => {
    evt.preventDefault();
    const form = evt.target;
    const formData = new FormData(form);
    const name = formData.get('name');
    const oldname = formData.get('oldname');
    const projectName = selectedProject.dataset.name;
    const res = await electron.editTaskDefinition({name, oldname, projectName})
    if (res.success) {
      taskDefList.querySelectorAll('[data-taskdef-item]').forEach((n) => {
        if (n.querySelector('[data-taskdef-name]').innerHTML === oldname) {
          n.querySelector('[data-taskdef-name]').innerHTML = name
        }
      })
      closeModal(form.closest('.modal'))
    }
  });

  addTaskDefForm.addEventListener('submit', async (evt) => {
    evt.preventDefault();
    const form = evt.target;
    const formData = new FormData(form);
    const name = formData.get('name');
    const projectName = selectedProject.dataset.name;
    const res = await electron.addTaskDefinition({name, projectName})
    if (res.success) {
      const taskDefItem = taskDefTemplate.cloneNode(true);
      taskDefItem.dataset.name = name;
      taskDefItem.addEventListener('click', onTaskDefItemClick.bind(null, taskDefItem));
      taskDefItem.querySelector('[data-taskdef-name]').innerHTML = name;
      taskDefList.appendChild(taskDefItem);
      loadTaskSelectbox();
    }
  });


  [projectButtons, taskButtons, taskDefButtons].forEach((b) => {
    b.addEventListener('click', (evt) => {
      evt.preventDefault();
      let dataset
      let form
      let formData
      const t = evt.target
      if (!t.dataset.actionType) {
        return;
      }
      switch (t.dataset.actionType) {
        case 'toggle-task':
          toggleTask()
          break;
        case 'edit-project':
          editProjectModal.querySelector('[data-project-name]').value = projectList.querySelector('[data-project-item].is-active').innerText
          editProjectModal.querySelector('[data-project-oldname]').value = projectList.querySelector('[data-project-item].is-active').innerText
          openModal(editProjectModal)
          break;
        case 'edit-task':
          dataset = selectedTask.dataset
          editTaskModal.querySelector('[data-task-oldname]').value = dataset.name
          editTaskModal.querySelector('[data-task-name]').value = dataset.name
          editTaskModal.querySelector('[data-task-description]').value = dataset.description
          editTaskModal.querySelector('[data-task-seconds]').value = dataset.seconds
          editTaskModal.querySelector('[data-task-seconds]').parentNode.querySelector('small').innerHTML = convertSecondsToTime(dataset.seconds)
          openModal(editTaskModal)
          break;
        case 'edit-taskdef':
          form = editTaskDefModal.querySelector('form')
          dataset = selectedTaskDef.dataset
          form.querySelector('input[name="oldname"]').value = dataset.name
          form.querySelector('input[name="name"]').value = dataset.name
          openModal(editTaskDefModal)
          break;
        case 'delete-taskdef':
          openModal(deleteTaskDefModal)
          break;
        case 'delete-project':
          openModal(deleteProjectModal)
          break;
        case 'delete-task':
          openModal(deleteTaskModal)
          break;
        default:
          break;
      }
    })
  });

  [
    deleteProjectModalButtons,
    deleteTaskModalButtons,
    deleteTaskDefModalButtons,
  ].forEach((b) => {
    b.addEventListener('click', async(evt) => {
      evt.preventDefault();
      const t = evt.target
      if (!t.dataset.actionType) {
        return;
      }
      switch (t.dataset.actionType) {
        case 'delete-project':
          await deleteProject(projectList.querySelector('[data-project-item].is-active'))
          taskActionsContainer.classList.add('is-hidden')
          taskDefSection.classList.add('is-hidden')
          closeModal(deleteProjectModal)
          break;
        case 'delete-task':
          await deleteTask(selectedTask)
          taskActionsContainer.classList.add('is-hidden')
          closeModal(deleteTaskModal)
          break;
        case 'delete-taskdef':
          await deleteTaskDefinition(selectedTaskDef)
          taskDefActionsContainer.classList.add('is-hidden')
          closeModal(deleteTaskDefModal)
          break;
        default:
          break;
      }
    })
  });

  document.getElementById('loader').classList.add('is-hidden')
  document.getElementById('content').classList.remove('is-hidden')
  document.body.classList.remove('is-loading')
}

document.addEventListener('DOMContentLoaded', async () => {
  await onRendererReady()
});
