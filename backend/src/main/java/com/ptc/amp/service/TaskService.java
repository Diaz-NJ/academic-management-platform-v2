package com.ptc.amp.service;

import com.ptc.amp.model.Task;
import com.ptc.amp.repository.TaskRepository;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class TaskService {
    private final TaskRepository taskRepository;

    public TaskService(TaskRepository taskRepository) {
        this.taskRepository = taskRepository;
    }

    public Task createTask(Task task) {
        return taskRepository.save(task);
    }

    public Optional<Task> getTaskById(Long id) {
        return taskRepository.findById(id);
    }

    public List<Task> getTasksByUserId(Long userId) {
        return taskRepository.findByUserIdOrderByDueDateAsc(userId);
    }

    // ✅ NEW: Get tasks by group ID
    public List<Task> getTasksByGroupId(Long groupId) {
        return taskRepository.findByGroupIdOrderByDueDateAsc(groupId);
    }

    public Task updateTask(Task task) {
        return taskRepository.save(task);
    }

    public boolean deleteTask(Long id) {
        if (taskRepository.existsById(id)) {
            taskRepository.deleteById(id);
            return true;
        }
        return false;
    }
}